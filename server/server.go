package server

import (
	"fmt"
	"log"
	"math/rand"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
)

/***************************************************************************************\
| 																						|
|		Note that: all the logics below are affected by our house rules!				|
|																						|
\************************************************************************************* */

const CanStackDraw2 = true;
const CanStackDraw4 = true;
const CanStackDraw4OnDraw2 = true;

type Server struct {
	cards []Card 
	currCardData []string
	// usedCards []Card
	direction int
	noPlayer int
	pos int
	draw2Stack int
	draw4Stack int
	players map[*Player]bool
	sync.RWMutex
}


/* 
	standard uno cards: 19x4 = {red, green, blue, yello}('0'+2x('1'->'9'))
					   2x4  = 2 skip cards of each color  
					   2x4  = 2 reverse cards of each color
					   2x4  = 2 draw2 cards of each color
					   4x2  = 4 change color cards + 4 draw4 cards
*/

// create 108 cards
func  InitAGame() Server {
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
	return Server{
		cards: cards, 
		// usedCards: []Card{}, 
		direction: 1, 
		noPlayer: 0,
		pos: 0,
		currCardData: []string{"*"},
		players: make(map[*Player]bool),
	}
}

func (s *Server) InitAPlayerCardSet(noCards int) []Card {
	cards := []Card{}
	for i := 0; i < noCards; i++ {
		p := rand.Int() % len(s.cards)
		cards = append(cards, s.cards[p])
		s.cards = RemoveACard(s.cards, p)
	}
	return cards
}

func (s *Server) ReceiveAValidCard(card Card) {
	// s.UsedCards = append(s.UsedCards, card)
	data := strings.Split(card.Data, ":")
	if data[1] == "num" {
		s.currCardData = data;
	} 
	switch data[2] {
	case "skip":
		s.skip1()	
		// update current data
		s.currCardData = data
	case "reverse":
		s.reverse()
		// update current data
		s.currCardData = data
	case "change":
		// update current data
		s.currCardData = data
	case "draw":
		if data[3] == "2" {
			s.draw2Stack++
			// update curren data
			s.currCardData = data
		} else if data[3] == "4" {
			s.draw4Stack++
			s.currCardData = data
		}
	}
	fmt.Sprintln("receive a weird card")
}

func (c* Server) skip1() {
	c.pos += c.direction;
}

func (s *Server) reverse() {
	s.direction = - s.direction;
}

func (s *Server) Draw(noCards int) []Card {
	cards := []Card{}
	for i := 0; i < noCards; i++ {
		cards = append(cards, s.draw1())
	}
	return cards
}

func (s *Server) draw1() Card {
	randPos := rand.Int() % len(s.cards)
	card := s.cards[randPos]
	s.cards = RemoveACard(s.cards, randPos)
	return card
}

func (s *Server) SendCardsToAPlayer(cards []Card, playerPos int) {

}

func (s *Server) AddPlayer(conn *websocket.Conn) {
	s.Lock()
	defer s.Unlock()

	newPlayer := NewPlayer(s.noPlayer, conn, s)
	if _, ok := s.players[newPlayer]; ok {
		log.Printf("player exists")
		return
	} 
	
	s.players[newPlayer] = true
	s.noPlayer++

	go newPlayer.readMessage()
	go newPlayer.writeMessage()
}

func (s *Server) RemovePlayer(player *Player) {
	s.Lock()
	defer s.Unlock()

	if _, ok := s.players[player]; ok {
		player.conn.Close()
		delete(s.players, player)
	}
}