package client

import (
	"errors"
	"log"
	"strings"
)

/***************************************************************************************\
| 																						|
|		Note that: all the logics below are affected by our house rules!				|
|																						|
\************************************************************************************* */

const CanStackDraw2 = true;
const CanStackDraw4 = true;
const Draw4OnDraw2 = true;

type Client struct {
	ID int 
	Cards []Card
	CurrentCardData []string
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
	return card, nil
}

func (c *Client) checkNextCardIsValid(data []string) bool {
	if c.CurrentCardData[0] == "*" {
		return true
	}

	if data[1] == "num" {
		return c.checkNumCard(data)
	} 
	return c.checkFunCard(data)
}

func (c *Client) checkNumCard(numCardData []string) bool {
	// prev card is num card
	if c.CurrentCardData[1] == "num" {
		return c.CurrentCardData[0] == numCardData[0] || 
			   c.CurrentCardData[2] == numCardData[2]
	}
	// prev card is fun card
	return c.CurrentCardData[0] == numCardData[0] 
}

func (c *Client) checkFunCard(funCardData []string) bool {
	if funCardData[2] == "skip" || funCardData[2] == "reverse" {
		return c.CurrentCardData[0] == funCardData[0]
	}
	
	if c.CurrentCardData[2] == "draw4" {
		return CanStackDraw4 && funCardData[2] == "draw4"
	}

	if c.CurrentCardData[2] == "draw2" {
		if funCardData[2] == "draw2" {
			return CanStackDraw2
		} else if funCardData[2] == "draw4" {
			return Draw4OnDraw2
		}
	}
	
	log.Fatal("None of functional cards match!")
	return false;
}