package server

import (
	"fmt"
	"math/rand"
	"strings"
)

/***************************************************************************************\
| 																						|
|		Note that: all the logics below are affected by our house rules!				|
|																						|
\************************************************************************************* */

const CanStackDraw2 = true;
const CanStackDraw4 = true;
const CanStackDraw4OnDraw2 = true;

type Coordinator struct {
	Cards []Card 
	UsedCards []Card
	Direction int
	NoPlayer int
	Pos int
	CurrCardData []string

	Draw2Stack int
	Draw4Stack int
}


/* 
	standard uno cards: 19x4 = {red, green, blue, yello}('0'+2x('1'->'9'))
					   2x4  = 2 skip cards of each color  
					   2x4  = 2 reverse cards of each color
					   2x4  = 2 draw2 cards of each color
					   4x2  = 4 change color cards + 4 draw4 cards
*/

// create 108 cards
func  InitAGame(noPlayers int) Coordinator {
	color := []string{"red","green","blue","yellow"}
	var cards []Card
	// 18x4 cards {red, green, blue, yello} from 1 -> 9
	for i := 0; i < 4; i++ {
		for j := 1; j <= 9; j++ {
			cards = append(cards, Card{Data: fmt.Sprintf("%v:num:%v", color[i], j)})
			cards = append(cards, Card{Data: fmt.Sprintf("%v:num:%v", color[i], j)})
		}
	}
	for i := 0; i < 4; i++ {
		// 4 {red, green, blue, yello} 0 cards
		cards = append(cards, Card{ Data: fmt.Sprintf("%v:num:0", color[i])})
		for j := 0; j < 2; j++ {
			// 2x4 {red, green, blue, yello} skip cards
			cards = append(cards, Card{ Data: fmt.Sprintf("%v:fun:skip", color[i])})
			// 2x4 {red, green, blue, yello} reverse cards
			cards = append(cards, Card{ Data: fmt.Sprintf("%v:fun:reverse", color[i])})
			// 2x4 {red, green, blue, yello} draw2 cards
			cards = append(cards, Card{ Data: fmt.Sprintf("%v:fun:draw:2", color[i])})
		}
		// 4 {red, green, blue, yello} change color cards
		cards = append(cards, Card{ Data: fmt.Sprintf("%v:fun:change", color[i])})
		// 4 {red, green, blue, yello} draw4 cards
		cards = append(cards, Card{ Data: fmt.Sprintf("%v:fun:draw:4", color[i])})
	}
	return Coordinator{
		Cards: cards, 
		UsedCards: []Card{}, 
		Direction: 1, 
		NoPlayer: noPlayers,
		Pos: 0,
		CurrCardData: []string{"*"},
	}
}

func (c *Coordinator) InitAPlayerCardSet(noCards int) []Card {
	cards := []Card{}
	for i := 0; i < noCards; i++ {
		p := rand.Int() % len(c.Cards)
		cards = append(cards, c.Cards[p])
		c.Cards = RemoveACard(c.Cards, p)
	}
	return cards
}

func (c *Coordinator) ReceiveAValidCard(card Card) {
	c.UsedCards = append(c.UsedCards, card)
	data := strings.Split(card.Data, ":")
	if data[1] == "num" {
		c.CurrCardData = data;
	} 
	switch data[2] {
	case "skip":
		c.skip1()	
		// update current data
		c.CurrCardData = data
	case "reverse":
		c.reverse()
		// update current data
		c.CurrCardData = data
	case "change":
		// update current data
		c.CurrCardData = data
	case "draw":
		if data[3] == "2" {
			c.Draw2Stack++
			// update curren data
			c.CurrCardData = data
		} else if data[3] == "4" {
			c.Draw4Stack++
			c.CurrCardData = data
		}
	}
	fmt.Sprintln("receive a weird card")
}

func (c* Coordinator) skip1() {
	c.Pos += c.Direction;
}

func (c *Coordinator) reverse() {
	c.Direction = - c.Direction;
}

func (c *Coordinator) Draw(noCards int) []Card {
	cards := []Card{}
	for i := 0; i < noCards; i++ {
		cards = append(cards, c.draw1())
	}
	return cards
}

func (c *Coordinator) draw1() Card {
	randPos := rand.Int() % len(c.Cards)
	card := c.Cards[randPos]
	c.Cards = RemoveACard(c.Cards, randPos)
	return card
}

func (c *Coordinator) SendCardsToAPlayer(cards []Card, playerPos int) {

}