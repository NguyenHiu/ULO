package server

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/gorilla/websocket"
)

type Player struct {
	id      int
	conn    *websocket.Conn
	manager *Server
	egress  chan Event
	cards   []Card
}

func (p *Player) readMessage() {
	defer func() {
		log.Printf("client %v is disconnected", p.conn.LocalAddr())
		p.manager.RemovePlayer(p)
	}()

	for {
		_, payload, err := p.conn.ReadMessage()
		if err != nil {
			log.Println("read error: ", err)
			break
		}

		var event Event
		err = json.Unmarshal(payload, &event)
		if err != nil {
			log.Printf("unmarshalling error: %v", err)
			break
		}

		// for c := range p.manager.players {
		// 	c.egress <- event
		// }

		if err := p.manager.routeEvent(event, p); err != nil {
			log.Printf("route event error: %v", err)
		}
	}
}
func (p *Player) writeMessage() {
	defer func() {
		log.Printf("client %v is disconnected", p.conn.LocalAddr())
		p.manager.RemovePlayer(p)
	}()

	for message := range p.egress {
		// if !ok {
		// 	if err := p.conn.WriteMessage(websocket.CloseMessage, nil); err != nil {
		// 		log.Printf("Close connection error: %v", err)
		// 	}
		// 	return
		// }

		data, err := json.Marshal(message)
		if err != nil {
			log.Println("masrshalling error: ", err)
			return
		}

		if err := p.conn.WriteMessage(websocket.TextMessage, data); err != nil {
			fmt.Println("Write message error: ", err)
		}
	}
}

func (p *Player) RemoveCardAt(pos int) {
	p.cards = RemoveACard(p.cards, pos)
}

type PlayerData struct {
	ID    int     `json:"id"`
	Cards []Card  `json:"cards"`
	Ctx   Context `json:"ctx"`
}
