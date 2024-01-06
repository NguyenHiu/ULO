package server

import (
	"fmt"
	"math/rand"
)

/***************************************************************************************\
| 																						|
|		Note that: all the logics below are affected by our house rules!				|
|																						|
\************************************************************************************* */

const CanStackDraw2 = true;
const CanStackDraw4 = true;
const Draw4OnDraw2 = true;

type Coordinator struct {
	Cards []Card 
	UsedCards []Card
	Direction int
	NoPlayer int
	Pos int
	CurrentCard Card

	Draw2Stack int
	Draw4Stack int
	SkipStack int
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
		CurrentCard: Card{Data: "*"},
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

func (c *Coordinator) Skip1Player() {
	c.Pos = (c.Pos+c.Direction)%c.NoPlayer;
} 

func (c *Coordinator) Reverse() {
	c.Direction = -c.Direction;
}

// func (c *Coordinator) draw1() {

// } 

func (c *Coordinator) ChangeColor(color int) {

}

