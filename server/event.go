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
	EventUpdateState         = "update_state"
	EventUpdateCards         = "update_cards"
	EventDrawCards           = "draw_cards"
	EventPlayCard            = "play_card"
	EventRequestData         = "request_data"
	EventInitPlayer          = "init_player"
	EventGameIsPlaying       = "game_is_playing"
	EventChooseColor         = "choose_color"
	EventChooseColorResponse = "choose_color_response"
	EventAppearWinner        = "end_game"
	EventCloseConnect        = "close_connect"
	// Event
)

type PlayCardEvent struct {
	ID       int      `json:"id"`
	CardData []string `json:"card"`
	CardPos  int      `json:"cardPos"`
}

type WinnerPayload struct {
	Winner string `json:"winner"`
}

func PlayCard(event Event, p *Player) error {
	if !p.manager.IsPlaying {
		p.manager.IsPlaying = true
	}

	var data PlayCardEvent
	err := json.Unmarshal(event.Payload, &data)
	if err != nil {
		return fmt.Errorf("PlayCard() unmarshalling error: %v", err)
	}

	if p.manager.sortedPlayers[p.manager.pos].id == data.ID {
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

		if data.CardData[2] == "change" {
			p.manager.currCardData = []string{"**"}
			emptyPayload, _ := json.Marshal(struct{}{})
			p.egress <- Event{
				Type:    EventChooseColor,
				Payload: emptyPayload,
			}
			p.manager.IsFreezing = true
			p.manager.FreezeReason = "someone is choosing color"
		}

		if len(p.cards) == 0 {
			w := WinnerPayload{Winner: p.name}
			pl, err := json.Marshal(w)
			if err != nil {
				return fmt.Errorf("can not marshal winner's name, err: %v", err)
			}
			event := Event{
				Type:    EventAppearWinner,
				Payload: pl,
			}
			for _, pp := range p.manager.sortedPlayers {
				pp.egress <- event
			}
		} else {
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

		}

		p.manager.PrintCurrentState()

	} else {
		log.Println("not this player's turn")
	}

	return nil
}

type DrawCardsEvent struct {
	ID     int `json:"id"`
	Amount int `json:"amount"`
}

func DrawCards(event Event, p *Player) error {

	log.Println("DrawCards()")
	var data DrawCardsEvent
	err := json.Unmarshal(event.Payload, &data)
	if err != nil {
		return fmt.Errorf("Draw1(), can not unmarshal event payload, err: %v", err)
	}

	if p.manager.sortedPlayers[p.manager.pos].id == data.ID {
		cards := p.manager.Draw(data.Amount)
		if len(p.cards)+data.Amount <= 35 {
			p.cards = append(p.cards, cards...)
		}

		// update this player's cards
		cardsData, err := json.Marshal(p.cards)
		if err != nil {
			return fmt.Errorf("PlayCard(), can not marshal player's cards")
		}
		p.egress <- Event{
			Type:    EventUpdateCards,
			Payload: cardsData,
		}

		noPlayers := len(p.manager.sortedPlayers)
		if p.manager.draw4Stack != 0 {
			p.manager.currCardData = []string{"**"}
			emptyPayload, _ := json.Marshal(struct{}{})
			p.manager.sortedPlayers[((p.manager.pos-p.manager.direction)%noPlayers+noPlayers)%noPlayers].egress <- Event{
				Type:    EventChooseColor,
				Payload: emptyPayload,
			}
			p.manager.IsFreezing = true
			p.manager.FreezeReason = "someone is choosing color"
		}

		p.manager.pos = ((p.manager.pos+p.manager.direction)%noPlayers + noPlayers) % noPlayers
		p.manager.draw2Stack = 0
		p.manager.draw4Stack = 0

		payload, _ := json.Marshal(*p.manager.getContext())
		updateCtxEvent := Event{
			Type:    EventUpdateState,
			Payload: payload,
		}
		for _, pp := range p.manager.sortedPlayers {
			pp.egress <- updateCtxEvent
		}

	} else {
		log.Printf("it's the turn of player having id: %v, name: %v", p.id, p.name)
		return errors.New("not your turn")
	}

	return nil
}

type RequestDataEvent struct {
	Name string `json:"name`
}

func RequestData(event Event, p *Player) error {
	if p.manager.IsPlaying {
		emptyPayload, _ := json.Marshal(struct{}{})
		p.egress <- Event{
			Type:    EventGameIsPlaying,
			Payload: emptyPayload,
		}
		return nil
	}

	var data RequestDataEvent
	err := json.Unmarshal(event.Payload, &data)
	if err != nil {
		return fmt.Errorf("can not unmarshal request data, err: %v", err)
	}

	// if cards, ok := p.manager.storage[data.Name]; ok {
	// 	log.Println("requestData, found data")
	// 	fmt.Println("cards: ", cards)

	// 	p.cards = cards
	// 	p.name = data.Name
	// 	p.manager.sortedPlayers = append(p.manager.sortedPlayers, p)
	// 	ctx := *p.manager.getContext()
	// 	playerSlotByte, err := json.Marshal(&PlayerSlot{
	// 		ID:    p.id,
	// 		Cards: p.cards,
	// 		Ctx:   ctx,
	// 	})

	// 	if err != nil {
	// 		return fmt.Errorf("can not marshal cards, err: %v", err)
	// 	}
	// 	p.egress <- Event{
	// 		Type:    EventInitPlayer,
	// 		Payload: playerSlotByte,
	// 	}

	// 	payload, err := json.Marshal(ctx)
	// 	if err != nil {
	// 		return fmt.Errorf("can not marshal context, error: %v", err)
	// 	}
	// 	updateStateEvent := Event{
	// 		Type:    EventUpdateState,
	// 		Payload: payload,
	// 	}
	// 	for _, pp := range p.manager.sortedPlayers {
	// 		if pp.name != p.name {
	// 			pp.egress <- updateStateEvent
	// 		}
	// 	}
	// } else {
	log.Println("requestData, not found data")

	p.cards = p.manager.InitAPlayerCardSet(NOCARD)
	p.name = data.Name
	p.manager.sortedPlayers = append(p.manager.sortedPlayers, p)
	ctx := *p.manager.getContext()
	playerSlotByte, err := json.Marshal(&PlayerSlot{
		ID:    p.id,
		Cards: p.cards,
		Ctx:   ctx,
	})

	if err != nil {
		return fmt.Errorf("can not marshal new cards, err: %v", err)
	}
	p.egress <- Event{
		Type:    EventInitPlayer,
		Payload: playerSlotByte,
	}

	payload, err := json.Marshal(ctx)
	if err != nil {
		return fmt.Errorf("can not marshal context, error: %v", err)
	}
	updateStateEvent := Event{
		Type:    EventUpdateState,
		Payload: payload,
	}
	for _, pp := range p.manager.sortedPlayers {
		if pp.name != p.name {
			pp.egress <- updateStateEvent
		}
	}
	// }

	return nil
}

type ChooseColor struct {
	Color string `json:"color"`
}

func ChooseColorResponse(event Event, p *Player) error {
	var chooseColor ChooseColor
	err := json.Unmarshal(event.Payload, &chooseColor)
	if err != nil {
		return fmt.Errorf("can not unmarshal choose color payload, err: %v", err)
	}

	p.manager.currCardData = []string{chooseColor.Color, "*"}
	ctxBytes, err := json.Marshal(p.manager.getContext())
	if err != nil {
		return fmt.Errorf("can not marshal new ctx after choosing color, err: %v", err)
	}

	newCtxEvent := Event{
		Type:    EventUpdateState,
		Payload: ctxBytes,
	}

	for _, pp := range p.manager.sortedPlayers {
		pp.egress <- newCtxEvent
	}

	return nil
}

func CloseConnectReload(event Event, p *Player) error {
	p.conn.Close()
	return nil
}
