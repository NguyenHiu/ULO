import { C, Event } from './const.js'
import { Player } from './player.js'
import { routeEvent } from './route.js'

window.onload = function () {
    if (!window["WebSocket"]) {
        alert("browser does not support websocket");
        return
    }

    // vars
    let CONN = new WebSocket("ws://" + document.location.host + "/ws")
    let MyPlayer = new Player()
    let MyPlayerName = ""

    // html elements
    let name = document.getElementById("nameInput");
    let nameBTN = document.getElementById("nameButton");
    let currentCardSlot = document.getElementById("current_card_slot")
    let drawBtn = document.getElementById("btn_draw")
    let playBtn = document.getElementById("btn_play")

    let chooseColor_red = document.getElementById("choose-color-red")
    let chooseColor_green = document.getElementById("choose-color-green")
    let chooseColor_blue = document.getElementById("choose-color-blue")
    let chooseColor_yellow = document.getElementById("choose-color-yellow")

    nameBTN.disabled = true;
    setTimeout(function () {
        nameBTN.disabled = false;

        drawBtn.onclick = function (e) {
            let n = 1
            if (MyPlayer.ctx.stack2 != 0 || MyPlayer.ctx.stack4 != 0) {
                n = MyPlayer.ctx.stack2 * 2 + MyPlayer.ctx.stack4 * 4
            }
            SendMessage("draw_cards", {
                id: MyPlayer.id,
                amount: n
            })
        }

        nameBTN.onclick = function (e) {
            if (name.value == "") {
                alert("name field is empty")
                return
            }

            MyPlayerName = name.value;

            let payload = {
                name: MyPlayerName
            }
            SendMessage("request_data", payload)
        }

        //  0: can not found
        //  1: exists & valid
        // -1: exists but not valid
        let findActiveCard = function (cardsRowObj, offset) {
            for (let i = 0; i < cardsRowObj.childElementCount; i++) {
                if (cardsRowObj.childNodes[i].firstChild.className.includes("active_card")) {
                    let data = cardsRowObj.childNodes[i].firstChild.id.replace("+", "*").split(C.FE_SEPARATOR)
                    if (!MyPlayer.checkNextCardIsValid(data)) {
                        alert("you can not play this card")
                        return -1
                    }

                    let payload = {
                        "id": MyPlayer.id,
                        "card": data,
                        "cardPos": i + offset
                    }
                    SendMessage("play_card", payload)
                    return 1
                }
            }
            return 0
        }

        playBtn.onclick = function (e) {
            let cards1 = document.getElementById("cards-1")
            let cards2 = document.getElementById("cards-2")
            if (findActiveCard(cards1, 0) == 0)
                findActiveCard(cards2, cards1.childElementCount)
        }

        let chooseColor_onclick = function (c) {
            let payload = { color: c }
            SendMessage("choose_color_response", payload)
            document.getElementById("choose-color").style.visibility = "hidden"
            document.getElementById("cover").style.visibility = "hidden"
        }

        chooseColor_red.onclick = function (e) { chooseColor_onclick(C.R) }
        chooseColor_green.onclick = function (e) { chooseColor_onclick(C.G) }
        chooseColor_blue.onclick = function (e) { chooseColor_onclick(C.B) }
        chooseColor_yellow.onclick = function (e) { chooseColor_onclick(C.Y) }


        function SendMessage(msgType, msgPayload) {
            let event = new Event(msgType, msgPayload);
            console.log("SendMessage()");
            console.log(event);
            CONN.send(JSON.stringify(event))
        }


        CONN.onmessage = function (e) {
            let data = JSON.parse(e.data);
            let event = Object.assign(new Event, data);
            console.log("on receive: ");
            console.log(event);
            routeEvent(event, MyPlayer, MyPlayerName, currentCardSlot);
        }

    }, 2000)
}



