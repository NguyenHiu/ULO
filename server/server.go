package server

import (
	"encoding/json"
	"errors"
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

const (
	CanStackDraw2        = true
	CanStackDraw4        = true
	CanStackDraw4OnDraw2 = true
	NOCARD               = 6
)

type Context struct {
	CurrData         []string `json:"currData"`
	Stack2           int      `json:"stack2"`
	Stack4           int      `json:"stack4"`
	AllowStack2      bool     `json:"allowStack2"`
	AllowStack4      bool     `json:"allowStack4"`
	AllowStack4Over2 bool     `json:"allowStack4Over2"`
}

type Server struct {
	cards        []Card
	currCardData []string
	direction    int
	pos          int
	nextID       int
	draw2Stack   int
	draw4Stack   int

	sortedPlayers []*Player
	storage       map[string][]Card

	handlers map[string]EventHandler
	sync.RWMutex
}

func InitAGame() *Server {
	color := []string{"red", "green", "blue", "yellow"}
	var cards []Card
	for i := 0; i < 4; i++ {
		for j := 1; j <= 9; j++ {
			cards = append(cards, Card{Data: fmt.Sprintf("%v:num:%v", color[i], j)})
			cards = append(cards, Card{Data: fmt.Sprintf("%v:num:%v", color[i], j)})
		}
	}
	for i := 0; i < 4; i++ {
		cards = append(cards, Card{Data: fmt.Sprintf("%v:num:0", color[i])})
		for j := 0; j < 2; j++ {
			cards = append(cards, Card{Data: fmt.Sprintf("%v:fun:skip", color[i])})
			cards = append(cards, Card{Data: fmt.Sprintf("%v:fun:reverse", color[i])})
			cards = append(cards, Card{Data: fmt.Sprintf("%v:fun:draw:2", color[i])})
		}
		cards = append(cards, Card{Data: fmt.Sprintf("%v:fun:change", color[i])})
		cards = append(cards, Card{Data: fmt.Sprintf("%v:fun:draw:4", color[i])})
	}

	s := &Server{
		cards:         cards,
		direction:     1,
		nextID:        0,
		pos:           0,
		currCardData:  []string{"*"},
		handlers:      make(map[string]EventHandler),
		storage:       make(map[string][]Card),
		sortedPlayers: []*Player{},
	}

	s.setupEventHandlers()

	return s
}

func (s *Server) NextID() int {
	s.nextID++
	return s.nextID - 1
}

func (s *Server) setupEventHandlers() {
	s.handlers[EventPlayCard] = PlayCard
	s.handlers[EventDrawCards] = DrawCards
}

func (s *Server) getContext() *Context {
	return &Context{
		CurrData:         s.currCardData,
		Stack2:           s.draw2Stack,
		Stack4:           s.draw4Stack,
		AllowStack2:      CanStackDraw2,
		AllowStack4:      CanStackDraw4,
		AllowStack4Over2: CanStackDraw4OnDraw2,
	}
}

func (s *Server) routeEvent(event Event, p *Player) error {
	if handler, ok := s.handlers[event.Type]; ok {
		if err := handler(event, p); err != nil {
			return err
		}
		return nil
	} else {
		return errors.New("there is no such event type")
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
	data := strings.Split(card.Data, ":")
	if data[1] == "num" {
		s.currCardData = data
	}
	switch data[2] {
	case "skip":
		s.skip1()
		s.currCardData = data
	case "reverse":
		s.reverse()
		s.currCardData = data
	case "change":
		s.currCardData = data
	case "draw":
		if data[3] == "2" {
			s.draw2Stack++
			s.currCardData = data
		} else if data[3] == "4" {
			s.draw4Stack++
			s.currCardData = data
		}
	}
	s.pos = (s.pos + s.direction) % len(s.sortedPlayers)
}

func (c *Server) skip1() {
	c.pos += c.direction
}

func (s *Server) reverse() {
	s.direction = -s.direction
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

func (s *Server) AddPlayer(conn *websocket.Conn) {
	s.Lock()
	fmt.Println("s.lock")
	defer func() { fmt.Println("s.unclock()") }()
	defer s.Unlock()

	fmt.Println("Request WS Connect from: ", conn.RemoteAddr())

	for _, p := range s.sortedPlayers {
		if p.conn.RemoteAddr() == conn.RemoteAddr() {
			fmt.Printf("address has already existed a player")
			return
		}
	}

	var cards []Card
	if _cards, ok := s.storage[strings.Split(conn.RemoteAddr().String(), ":")[0]]; ok {
		fmt.Printf("player exists, load data")
		cards = _cards
	} else {
		fmt.Println("requesting new card set...")
		cards = s.InitAPlayerCardSet(NOCARD)
	}

	player := Player{
		id:      s.NextID(),
		conn:    conn,
		manager: s,
		egress:  make(chan Event),
		cards:   cards,
	}

	playerData := PlayerData{
		ID:    player.id,
		Cards: player.cards,
		Ctx:   *s.getContext(),
	}

	log.Printf("New Player: \n\tID:%v\n\tCards:%v", playerData.ID, playerData.Cards)

	playerDataByte, err := json.Marshal(playerData)
	if err != nil {
		log.Println("marshalling player data error: ", err)
		return
	}

	initPlayerEvent := Event{
		Type:    "init_player",
		Payload: playerDataByte,
	}

	go player.readMessage()
	go player.writeMessage()

	player.egress <- initPlayerEvent
}

func (s *Server) RemovePlayer(player *Player) {
	s.Lock()
	fmt.Println("remove s.lock()")
	defer func() { fmt.Println("remove s.unclock()") }()
	defer s.Unlock()

	s.storage[strings.Split(player.conn.LocalAddr().String(), ":")[0]] = player.cards

	fmt.Printf("find: %v", player.conn.RemoteAddr().String())
	for idx, ele := range s.sortedPlayers {
		fmt.Println(ele)
		if ele.conn.RemoteAddr().String() == player.conn.RemoteAddr().String() {
			s.sortedPlayers = append(append([]*Player{}, s.sortedPlayers[:idx]...), s.sortedPlayers[idx+1:]...)
			fmt.Println("RemovePlayer(), remove successfully!")
			break
		}
	}
}

func (s *Server) PrintCurrentState() {
	fmt.Printf("pos: %v\n", s.pos)
	fmt.Printf("direction: %v\n", s.direction)
}
