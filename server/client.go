package server

import (
	"fmt"
	"log"

	"github.com/gorilla/websocket"
)

type Player struct {
	id int 
	conn *websocket.Conn
	manager *Server
	egress chan []byte
}

func NewPlayer(id int, conn *websocket.Conn, manager *Server) *Player {
	return &Player{
		id: id,
		conn: conn,
		manager: manager,
		egress: make(chan []byte),
	}
}

func (p  *Player) readMessage() {
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

		// type T struct {
		// 	ID int `json:"id"`
		// }
		// var t T
		// err = json.Unmarshal(payload, &t)
		if err != nil {
			log.Printf("marshal error: %v", err)
			break
		}

		for c := range p.manager.players {
			c.egress <- payload
		}
		
		fmt.Println("msg: ", string(payload))
	}
}

func (p *Player) writeMessage() {
	defer func() {
		log.Printf("client %v is disconnected", p.conn.LocalAddr())
		p.manager.RemovePlayer(p)
	}()

	for {
		select {
		case message, ok := <-p.egress:
			if !ok {
				if err := p.conn.WriteMessage(websocket.CloseMessage, nil); err != nil {
					log.Printf("Close connection error: %v", err)
				}	
				return
			}
			if err := p.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				fmt.Println("Write message error: ", err)
			}
		}
	}
}
