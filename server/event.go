package server

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"
)

type Event struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type EventHandler func(event Event, p *Player) error

const (
	EventUpdateState = "update_state"
	EventUpdateCards = "update_cards"
	EventDrawCards   = "draw_cards"
	EventPlayCard    = "play_card"
)

type PlayCardEvent struct {
	From     int      `json:"from"`
	CardData []string `json:"card"`
	CardPos  int      `json:"cardPos"`
}

type DrawCardsEvent struct {
	From   int `json:"from"`
	Amount int `json:"amount"`
}

func PlayCard(event Event, p *Player) error {
	var data PlayCardEvent
	err := json.Unmarshal(event.Payload, &data)
	if err != nil {
		return fmt.Errorf("PlayCard() unmarshalling error: %v", err)
	}

	if p.manager.pos == data.From {
		p.manager.ReceiveAValidCard(Card{Data: strings.Join(data.CardData, ":")})
		p.RemoveCardAt(data.CardPos)

		// update this player's cards
		cards, err := json.Marshal(p.cards)
		if err != nil {
			return fmt.Errorf("PlayCard(), can not marshal player's cards")
		}
		p.egress <- Event{
			Type:    EventUpdateCards,
			Payload: cards,
		}

		// update global context
		ctx, err := json.Marshal(p.manager.getContext())
		if err != nil {
			return fmt.Errorf("PlayCard(), can not marshal context")
		}
		event := Event{
			Type:    EventUpdateState,
			Payload: ctx,
		}
		for _, player := range p.manager.sortedPlayers {
			player.egress <- event
		}

		p.manager.PrintCurrentState()

	} else {
		log.Println("not this player's turn")
	}

	return nil
}

func DrawCards(event Event, p *Player) error {
	log.Println("DrawCards()")
	var data DrawCardsEvent
	err := json.Unmarshal(event.Payload, &data)
	if err != nil {
		return fmt.Errorf("Draw1(), can not unmarshal event payload, err: %v", err)
	}

	if p.manager.pos == data.From {
		cards := p.manager.Draw(data.Amount)
		p.cards = append(p.cards, cards...)

		// update this player's cards
		cardsData, err := json.Marshal(p.cards)
		if err != nil {
			return fmt.Errorf("PlayCard(), can not marshal player's cards")
		}
		p.egress <- Event{
			Type:    EventUpdateCards,
			Payload: cardsData,
		}

	} else {
		return errors.New("not your turn")
	}

	return nil
}
