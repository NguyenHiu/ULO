package main

import (
	"fmt"

	"github.com/NguyenHiu/UNO/client"
	"github.com/NguyenHiu/UNO/server"
)

func s2c(serverCards []server.Card) []client.Card {
	var cCard []client.Card
	for _, c := range serverCards {
		cCard = append(cCard, client.Card(c))
	}
	return cCard
}

func c2s(clientCards []client.Card) []server.Card {
	var sCards []server.Card
	for _, c := range clientCards {
		sCards = append(sCards, server.Card(c))
	}
	return sCards
}

func main() {
	c := server.InitAGame(2)
	ctx := client.MContext{
		CurrCardData: c.CurrCardData,
		Draw2Stack: 0,
		Draw4Stack: 0,
		CanStackDraw2: false,
		CanStackDraw4:  false,
		CanStackDraw4OnDraw2: false,
	}
	p1 := client.Client{
		ID: 0,
		Cards: s2c(c.InitAPlayerCardSet(6)),
		Ctx: ctx,
	}
	p2 := client.Client {
		ID: 1,
		Cards: s2c(c.InitAPlayerCardSet(6)),
		Ctx: ctx,
	}

	var index int
	var card client.Card
	var err error
	for {
		newCTX := client.MContext{
			CurrCardData: c.CurrCardData,
			Draw2Stack: c.Draw2Stack,
			Draw4Stack: c.Draw4Stack,
			CanStackDraw2: server.CanStackDraw2,
			CanStackDraw4: server.CanStackDraw4,
			CanStackDraw4OnDraw2: server.CanStackDraw4OnDraw2,
		}
		p1.SetNewContext(newCTX)
		p2.SetNewContext(newCTX)

		fmt.Printf("------------\nPlayer 1 cards:\n")
		p1.ShowCards()
		fmt.Printf("Player 2 cards:\n")
		p2.ShowCards()
		fmt.Printf("------------\n")
		fmt.Printf("Current Data: %v\n\\/", c.CurrCardData)
		fmt.Printf("Player %v turn, choose your card:", c.Pos+1)
		fmt.Scanf("%v", &index)
		if index == -1 {
			if c.Pos == 0 {
				cards := c.Draw(p1.Draw())
				p1.Cards = append(p1.Cards, s2c(cards)...)
			} else {
				cards := c.Draw(p2.Draw())
				p2.Cards = append(p2.Cards, s2c(cards)...)
			}
			c.Draw2Stack = 0
			c.Draw4Stack = 0
		} else {
			if c.Pos == 0 {
				card, err = p1.PlayCardAt(index)
				if err != nil {
					fmt.Printf("you can not play this card, choose another card!\n")
					continue
				}
			} else {
				card, err = p2.PlayCardAt(index)
				if err != nil {
					fmt.Printf("you can not play this card, choose another card!\n")
					continue
				}
			}
			c.ReceiveAValidCard(server.Card(card))
		}
		c.Pos = (c.Pos + 1) % c.NoPlayer;
	}
}