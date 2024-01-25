import { C, Event, Obj } from './constants.js'
import { Player } from './player.js'
import { routeEvent } from './route.js'

window.onload = function () {
    if (!window["WebSocket"]) {
        alert("Browser does not support websocket");
        return
    }

    let PlayerData = {
        Data: new Player(),
        Name: "",
        SC: new WebSocket("ws://" + document.location.host + "/ws")
    }


    Obj.LoginButton.disabled = true;
    setTimeout(function () { Obj.LoginButton.disabled = false; }, 2000)

    Obj.LoginButton.onclick = function (e) {
        if (Obj.LoginInput.value == "") {
            alert("Invalid name!")
            return
        }
        PlayerData.Name = Obj.LoginInput.value
        SendMessage("request_data", { name: PlayerData.Name })
    }

    Obj.PlayButton.onclick = function (e) {
        let activeCard = document.getElementsByClassName("m-active-card")[0]
        if (activeCard != null) {
            if (PlayerData.Data.ctx.checkNextCardIsValid(activeCard.id)) {
                let idx = Array.prototype.indexOf.call(Obj.UpperCardSet.children, activeCard.parentNode)
                if (idx != -1) {
                    SendMessage("play_card", {
                        id: PlayerData.Data.id,
                        card: activeCard.id.split(C.SEPARATOR),
                        cardPos: idx
                    })
                }
                idx = Array.prototype.indexOf.call(Obj.BelowCardSet.children, activeCard.parentNode)
                if (idx != -1) {
                    SendMessage("play_card", {
                        id: PlayerData.Data.id,
                        card: activeCard.id.split(C.SEPARATOR),
                        cardPos: idx + Obj.UpperCardSet.children.length
                    })
                }
                console.log("Congratulation! You found a bug!")
            } else console.log("The selected card is not valid in this context")
        } else console.log("You did not choose any card")
    }

    Obj.DrawButton.onclick = function (e) {
        let amount = PlayerData.Data.ctx.stack2 * 2 + PlayerData.Data.ctx.stack4 * 4
        console.log("amount: " + amount);
        SendMessage("draw_cards", {
            id: PlayerData.Data.id,
            amount: ((amount == 0) ? 1 : amount)
        })
    }

    let chooseColor_onclick = function (c) {
        SendMessage("choose_color_response", { color: c })
        Obj.ChooseColorLayout.hidden = true
    }
    Obj.ColorRed.onclick = function (e) { chooseColor_onclick(C.R) }
    Obj.ColorGreen.onclick = function (e) { chooseColor_onclick(C.G) }
    Obj.ColorBlue.onclick = function (e) { chooseColor_onclick(C.B) }
    Obj.ColorYellow.onclick = function (e) { chooseColor_onclick(C.Y) }

    Obj.DrawedButtonPlay.onclick = function (e) {
        let objID = Obj.DrawedCardSlot.children[0].id
        if (PlayerData.Data.ctx.checkNextCardIsValid(objID)) {
            SendMessage("play_card", {
                id: PlayerData.Data.id,
                card: objID.split(C.SEPARATOR),
                cardPos: PlayerData.Data.cards.length - 1
            })
            Obj.DrawOrSkip.hidden = true
        } else console.log("The selected card is not valid in this context")
    }

    Obj.DrawedButtonSkip.onclick = function (e) {
        Obj.DrawOrSkip.hidden = true
        SendMessage("next_player", {})
    }

    function SendMessage(msgType, msgPayload) {
        let event = new Event(msgType, msgPayload)
        console.log("Send Message: " + event.type)
        PlayerData.SC.send(JSON.stringify(event))
    }

    PlayerData.SC.onmessage = function (e) {
        let data = JSON.parse(e.data);
        let event = Object.assign(new Event, data);
        console.log("Receive Message: " + event.type);
        routeEvent(event, PlayerData);
    }
}



