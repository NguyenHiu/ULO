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
	CurrData          string   `json:"currData"`
	Stack2            int      `json:"stack2"`
	Stack4            int      `json:"stack4"`
	AllowStack2       bool     `json:"allowStack2"`
	AllowStack4       bool     `json:"allowStack4"`
	AllowStack4Over2  bool     `json:"allowStack4Over2"`
	NoPlayer          int      `json:"noplayer"`
	PlayerNames       []string `json:"playernames"`
	PlayerNoCards     []int    `json:"playernocards"`
	UnoNames          []string `json:"unonames"`
	CurrentPlayerName string   `json:"currentPlayerName"`
}

type Server struct {
	cards        []Card
	currCardData string
	direction    int
	pos          int
	nextID       int
	draw2Stack   int
	draw4Stack   int

	IsPlaying bool

	sortedPlayers []*Player

	handlers map[string]EventHandler
	sync.RWMutex
}

func InitAGame() *Server {
	color := []string{"red", "green", "blue", "yellow"}
	var cards []Card
	for i := 0; i < 4; i++ {
		for j := 1; j <= 9; j++ {
			cards = append(cards, Card{Data: fmt.Sprintf("%v-num-%v", color[i], j)})
			cards = append(cards, Card{Data: fmt.Sprintf("%v-num-%v", color[i], j)})
		}
	}
	for i := 0; i < 4; i++ {
		cards = append(cards, Card{Data: fmt.Sprintf("%v-num-0", color[i])})
		for j := 0; j < 2; j++ {
			cards = append(cards, Card{Data: fmt.Sprintf("%v-fun-skip", color[i])})
			cards = append(cards, Card{Data: fmt.Sprintf("%v-fun-reverse", color[i])})
			cards = append(cards, Card{Data: fmt.Sprintf("%v-fun-draw-2", color[i])})
		}
		cards = append(cards, Card{Data: "+-fun-change"})
		cards = append(cards, Card{Data: "+-fun-draw-4"})
	}

	s := &Server{
		cards:         cards,
		direction:     1,
		nextID:        0,
		pos:           0,
		currCardData:  "+-+",
		handlers:      make(map[string]EventHandler),
		sortedPlayers: []*Player{},
		IsPlaying:     false,
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
	s.handlers[EventRequestData] = RequestData
	s.handlers[EventChooseColorResponse] = ChooseColorResponse
	s.handlers[EventCloseConnect] = CloseConnectReload
	s.handlers[EventNextPlayer] = NextPlayer
	s.handlers[EventUnoCall] = UnoCall
	s.handlers[EventUnoPunish] = UnoPunish
}

func (s *Server) getContext() *Context {
	name := []string{}
	nocards := []int{}
	unoNames := []string{}
	fmt.Printf("length of sorted players: %v", len(s.sortedPlayers))
	for _, p := range s.sortedPlayers {
		name = append(name, p.name)
		nocards = append(nocards, len(p.cards))
		if p.isUNO {
			unoNames = append(unoNames, p.name)
		}
	}

	return &Context{
		CurrData:          s.currCardData,
		Stack2:            s.draw2Stack,
		Stack4:            s.draw4Stack,
		AllowStack2:       CanStackDraw2,
		AllowStack4:       CanStackDraw4,
		AllowStack4Over2:  CanStackDraw4OnDraw2,
		NoPlayer:          len(s.sortedPlayers),
		PlayerNames:       name,
		PlayerNoCards:     nocards,
		UnoNames:          unoNames,
		CurrentPlayerName: s.sortedPlayers[s.pos].name,
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
func (s *Server) InitACardSet(noCards int) []Card {
	cards := []Card{}
	for i := 0; i < noCards; i++ {
		p := rand.Int() % len(s.cards)
		cards = append(cards, s.cards[p])
		s.cards = RemoveACard(s.cards, p)
	}
	return cards
}

func (s *Server) ReceiveAValidCard(card Card) {
	data := strings.Split(card.Data, "-")
	if data[1] == "num" {
		s.currCardData = card.Data
	}
	switch data[2] {
	case "skip":
		s.skip1()
		s.currCardData = card.Data
	case "reverse":
		s.reverse()
		s.currCardData = card.Data
	case "change":
		s.currCardData = card.Data
	case "draw":
		if data[3] == "2" {
			s.draw2Stack++
			s.currCardData = card.Data
		} else if data[3] == "4" {
			s.draw4Stack++
			s.currCardData = card.Data
		}
	}
	noPlayers := len(s.sortedPlayers)
	s.pos = ((s.pos+s.direction)%noPlayers + noPlayers) % noPlayers
}

func (c *Server) skip1() {
	noPlayers := len(c.sortedPlayers)
	c.pos = ((c.pos+c.direction)%noPlayers + noPlayers) % noPlayers
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
	defer s.Unlock()

	fmt.Println("Request WS Connect from: ", conn.RemoteAddr())

	for _, p := range s.sortedPlayers {
		if p.conn.RemoteAddr() == conn.RemoteAddr() {
			fmt.Printf("address has already existed a player")
			return
		}
	}

	player := &Player{
		id:      s.NextID(),
		conn:    conn,
		manager: s,
		egress:  make(chan Event),
		cards:   []Card{},
		name:    "",
		isUNO:   false,
	}

	go player.readMessage()
	go player.writeMessage()
}

func (s *Server) RemovePlayer(player *Player) {
	s.Lock()
	defer s.Unlock()
	fmt.Println("Removeing a player")
	for idx, ele := range s.sortedPlayers {
		if ele.conn.RemoteAddr().String() == player.conn.RemoteAddr().String() {
			s.sortedPlayers = append(append([]*Player{}, s.sortedPlayers[:idx]...), s.sortedPlayers[idx+1:]...)
			break
		}
	}

	noPlayers := len(s.sortedPlayers)
	if noPlayers != 0 {
		s.pos = ((s.pos+s.direction)%noPlayers + noPlayers) % noPlayers
	} else {
		s.pos = 0
	}

	if len(s.sortedPlayers) == 0 {
		s.Reset()
		return
	}

	ctxbytes, err := json.Marshal(*s.getContext())
	if err != nil {
		log.Println("masrhalling context error: ", err)
		return
	}

	updateStateEvent := Event{
		Type:    EventUpdateState,
		Payload: ctxbytes,
	}

	for _, p := range s.sortedPlayers {
		p.egress <- updateStateEvent
	}
}

func (s *Server) PrintCurrentState() {
	fmt.Printf("pos: %v\n", s.pos)
	fmt.Printf("direction: %v\n", s.direction)
}

func (s *Server) Reset() {
	color := []string{"red", "green", "blue", "yellow"}
	var cards []Card
	for i := 0; i < 4; i++ {
		for j := 1; j <= 9; j++ {
			cards = append(cards, Card{Data: fmt.Sprintf("%v-num-%v", color[i], j)})
			cards = append(cards, Card{Data: fmt.Sprintf("%v-num-%v", color[i], j)})
		}
	}
	for i := 0; i < 4; i++ {
		cards = append(cards, Card{Data: fmt.Sprintf("%v-num-0", color[i])})
		for j := 0; j < 2; j++ {
			cards = append(cards, Card{Data: fmt.Sprintf("%v-fun-skip", color[i])})
			cards = append(cards, Card{Data: fmt.Sprintf("%v-fun-reverse", color[i])})
			cards = append(cards, Card{Data: fmt.Sprintf("%v-fun-draw-2", color[i])})
		}
		cards = append(cards, Card{Data: "+-fun-change"})
		cards = append(cards, Card{Data: "+-fun-draw-4"})
	}
	s.cards = cards
	s.direction = 1
	s.nextID = 0
	s.pos = 0
	s.currCardData = "+-+"
	s.handlers = make(map[string]EventHandler)
	s.sortedPlayers = []*Player{}
	s.IsPlaying = false
	s.draw2Stack = 0
	s.draw4Stack = 0
	s.setupEventHandlers()
}
