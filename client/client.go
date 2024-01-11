package client

import (
	"errors"
	"fmt"
	"strings"
)

/***************************************************************************************\
| 																						|
|		Note that: all the logics below are affected by our house rules!				|
|																						|
\************************************************************************************* */

type Client struct {
	ID int 
	Cards []Card
	Ctx MContext
}

type MContext struct {
	CurrCardData []string
	Draw2Stack int
	Draw4Stack int
	CanStackDraw2 bool
	CanStackDraw4 bool
	CanStackDraw4OnDraw2 bool
}

func (c *Client) SetNewContext(NewCtx MContext) {
	c.Ctx = NewCtx;
}

func (c *Client) Draw() int {
	if c.Ctx.Draw2Stack == 0 && c.Ctx.Draw4Stack == 0 {
		return 1;
	}
	return c.Ctx.Draw2Stack*2 + c.Ctx.Draw4Stack*4
}

func (c *Client) Draw1(newCard Card) {
	c.Cards = append(c.Cards, newCard)
} 

func (c *Client) PlayCardAt(index int) (Card, error) {
	if index >= len(c.Cards) {
		return Card{}, errors.New("index >= number of cards")
	}

	card := c.Cards[index]
	data := strings.Split(card.Data, ":")
	if !c.checkNextCardIsValid(data) {
		return Card{}, errors.New("can not play this card")
	}
	c.Cards = RemoveACard(c.Cards, index)

	// should be user input
	if data[1] == "fun" && data[2] == "change" {
		card.Data = fmt.Sprintf("%v:%v:%v:%v", data[0], data[1], data[2], "red")
	}

	return card, nil
}

// [color, fun, type-of-func, other parameters,...]
// [color, num, number]
func (c *Client) checkNextCardIsValid(data []string) bool {
	if c.Ctx.CurrCardData[0] == "*" {
		return true
	}

	if data[1] == "num" {
		return c.checkNumCard(data)
	} 
	return c.checkFunCard(data)
}

func (c *Client) checkNumCard(numCardData []string) bool {
	if  c.Ctx.Draw2Stack != 0 || c.Ctx.Draw4Stack != 0 {
		return false;
	}

	// prev card is num card
	if c.Ctx.CurrCardData[1] == "num" {
		return c.Ctx.CurrCardData[0] == numCardData[0] || 
			   c.Ctx.CurrCardData[2] == numCardData[2]
	}
	// prev card is fun card
	return c.Ctx.CurrCardData[0] == numCardData[0] 
}

func (c *Client) checkFunCard(funCardData []string) bool {
	if funCardData[2] == "skip" || funCardData[2] == "reverse" {
		return c.Ctx.Draw2Stack == 0 && c.Ctx.Draw4Stack == 0 && 
			(c.Ctx.CurrCardData[0] == funCardData[0] ||
			 c.Ctx.CurrCardData[2] == funCardData[2])
	}
	
	if c.Ctx.CurrCardData[2] == "draw" {
		switch c.Ctx.CurrCardData[3] {
		case "4":
			return c.Ctx.CanStackDraw4 && funCardData[2] == "draw" && funCardData[3] == "4"
		case "2":
			if funCardData[2] == "draw" && funCardData[3] == "2" {
				return c.Ctx.CanStackDraw2
			} else if funCardData[2] == "draw" && funCardData[3] == "4" {
				return c.Ctx.CanStackDraw4OnDraw2
			}
		}
	}

	return true
}

// =====================

func (c *Client) ShowCards() {
	i := 0
	for _, e := range c.Cards {
		data := strings.Split(e.Data, ":")
		if data[1] == "num" {
			fmt.Printf("\t%v. %v, %v\n", i, data[2], data[0])
		} else {
			if data[2] == "draw" {
				fmt.Printf("\t%v. %v %v\n", i, data[2], data[3])
			} else {
				fmt.Printf("\t%v. %v, %v\n", i, data[2], data[0])
			}
		}
		i++
	}
}