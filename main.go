package main

import (
	"fmt"
	"net/http"

	s "github.com/NguyenHiu/UNO/server"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize: 1024,
	WriteBufferSize: 1024,
}

var (
	S *s.Server = s.InitAGame()
)


func main() {
	http.Handle("/", http.FileServer(http.Dir("./frontend")))
	http.HandleFunc("/ws", handleWS)
	http.ListenAndServe(":8080", nil)
}

func handleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("connect error: ", err)
		return
	}
	fmt.Printf("new connection, address: %v\n", conn.LocalAddr())
	S.AddPlayer(conn)
}