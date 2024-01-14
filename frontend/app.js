

class Event {
    constructor(type, payload) {
        this.type = type;
        this.payload = payload;
    }
}

class Card {
    constructor(raw) {
        this.data = raw.split(":")
    }
}

class Context {
    constructor(currData, stack2, stack4, allowStack2, allowStack4, allowStack4Over2, noplayer, playernames, playernocards) {
        this.currData = currData
        this.stack2 = stack2
        this.stack4 = stack4
        this.allowStack2 = allowStack2
        this.allowStack4 = allowStack4
        this.allowStack4Over2 = allowStack4Over2
        this.noplayer = noplayer
        this.playernames = playernames
        this.playernocards = playernocards
    }
}

class Player {
    constructor(id, cards, context) {
        this.id = id
        this.cards = cards
        this.ctx = context
    }

    setNewContext(newCTX) {
        this.ctx = newCTX
    }

    checkNumCard(data) {
        if ((this.ctx.stack2 != 0) || (this.ctx.stack4 != 0))
            return false;
        if (this.ctx.currData[1] == "num")
            return (this.ctx.currData[0] == data[0]) ||
                (this.ctx.currData[2] == data[2]);

        return this.ctx.currData[0] == data[0];
    }

    checkFunCard(data) {
        if (data[2] == "change")
            return this.ctx.stack2 == 0 && this.ctx.stack4 == 0;

        if ((data[2] == "skip") || data[2] == "reverse")
            return (this.ctx.stack2 == 0) && (this.ctx.stack4 == 0) &&
                (this.ctx.currData[0] == data[0] || this.ctx.currData[2] == data[2]);

        if (this.ctx.currData[2] == "draw") {
            switch (this.ctx.currData[3]) {
                case "4":
                    return this.ctx.allowStack4 && (data[2] == "draw") && data[3] == "4";
                case "2":
                    if ((data[2] == "draw") && data[3] == "2")
                        return this.ctx.allowStack2;
                    else if ((data[2] == "draw") && data[3] == "4")
                        return this.ctx.allowStack4Over2;
                    break;

            }
        }

        return true;
    }

    checkNextCardIsValid(data) {
        // data: strng array
        if (this.ctx.currData == "*")
            return true;
        if (data[1] == "num") {
            return this.checkNumCard(data);
        }
        else {
            return this.checkFunCard(data);
        }
    }

    addNewCards(cards) {
        for (let i = 0; i < cards.length; i++) {
            this.cards.push(new Card(cards[i].data))
        }
    }
}


window.onload = function () {
    if (!window["WebSocket"]) {
        alert("browser does not support websocket");
        return
    }

    let CONN = new WebSocket("ws://" + document.location.host + "/ws")
    let MyPlayer = new Player()
    let MyPlayerName = ""
    // let currentCard = document.getElementById("current-card");
    // let cards = document.getElementById("cards");
    // let nextCard = document.getElementById("next-card");
    // let submitBTN = document.getElementById("submit");
    let name = document.getElementById("nameInput");
    let nameBTN = document.getElementById("nameButton");

    nameBTN.onclick = function (e) {
        if (name.value == "") {
            alert("name field is empty")
            return
        }

        MyPlayerName = name.value;

        document.getElementById("data").hidden = false;
        document.getElementById("login").hidden = true;

        document.getElementById("login").value = MyPlayerName;

        let payload = {
            name: MyPlayerName
        }
        SendMessage("request_data", payload)
    }

    function updateUI() {
        let n = MyPlayer.ctx.noplayer;
        let names = [];
        let noCards = [];

        // sort players
        let i = 0
        let detech = false
        while (names.length < n) {
            if (MyPlayer.ctx.playernames[i] == MyPlayerName) {
                detech = true
            }
            if (detech) {
                names.push(MyPlayer.ctx.playernames[i])
                noCards.push(MyPlayer.ctx.playernocards[i])
            }
            i = (i + 1) % n
        }

        let position = calculatePositionOfPlayers(n)

        let left = document.getElementById("left")
        let right = document.getElementById("right")
        let top = document.getElementById("top")

        i = 1
        for (let j = 0; j < position.side; j++) {
            let newObj = document.createElement("p")
            newObj.innerText = names[i + j] + ", " + noCards[i + j]
            left.appendChild(newObj)
        }
        i += position.side

        for (let j = 0; j < position.top; j++) {
            let newObj = document.createElement("p")
            newObj.innerText = names[i + j] + ", " + noCards[i + j]
            top.appendChild(newObj)
        }
        i += position.top

        for (let j = 0; j < position.side; j++) {
            let newObj = document.createElement("p")
            newObj.innerText = names[i + j] + ", " + noCards[i + j]
            right.appendChild(newObj)
        }
    }

    // submitBTN.onclick = function (e) {
    //     let nextCardPos = parseInt(nextCard.value)
    //     if (nextCardPos === undefined) {
    //         alert("next card is undefined")
    //     }

    //     if (nextCardPos == -1) {
    //         let n = 1
    //         if (MyPlayer.ctx.stack2 != 0 || MyPlayer.ctx.stack4 != 0) {
    //             n = MyPlayer.ctx.stack2 * 2 + MyPlayer.ctx.stack4 * 4
    //         }
    //         SendMessage("draw_cards", {
    //             from: MyPlayer.id,
    //             amount: n
    //         })
    //         return
    //     }

    //     if (nextCardPos < 0 ||
    //         nextCardPos > MyPlayer.cards.length) {
    //         alert("invalid index")
    //         return
    //     }

    //     let data = MyPlayer.cards[nextCardPos].data
    //     if (!MyPlayer.checkNextCardIsValid(data)) {
    //         alert("you can not play this card")
    //         return
    //     }

    //     let payload = {
    //         id: MyPlayer.id,
    //         card: data,
    //         cardPos: nextCardPos
    //     }
    //     SendMessage("play_card", payload)
    // }

    function routeEvent(event) {
        if (event.type === undefined) {
            alert("no type field in the event");
            return;
        }

        switch (event.type) {
            case "init_player":
                MyPlayer = Object.assign(new Player, event.payload)
                // cards
                for (let i = 0; i < MyPlayer.cards.length; i++) {
                    MyPlayer.cards[i] = new Card(MyPlayer.cards[i].data)
                }
                // ctx
                MyPlayer.ctx = Object.assign(new Context, MyPlayer.ctx)
                updateUI();
                break;

            case "update_state":
                let newCTX = Object.assign(new Context, event.payload)
                MyPlayer.setNewContext(newCTX)
                updateUI();
                break;

            case "update_cards":
                MyPlayer.cards = []
                MyPlayer.addNewCards(event.payload)
                updateUI();
                break;
            default:
                alert("do not support this type of message");
                break;
        }

    }

    function SendMessage(msgType, msgPayload) {
        let event = new Event(msgType, msgPayload);
        console.log(event);
        CONN.send(JSON.stringify(event))
    }


    CONN.onmessage = function (e) {
        let data = JSON.parse(e.data);
        let event = Object.assign(new Event, data);
        console.log(event);
        routeEvent(event);
    }

}
function calculatePositionOfPlayers(noPlayers) {
    switch (noPlayers) {
        case 1:
            return { "top": 0, "side": 0 }
        case 2:
            return { "top": 1, "side": 0 }
        case 3:
            return { "top": 0, "side": 1 }
        default:
            let eachSide = parseInt((noPlayers - 1) / 3)
            let leftPlayers = (noPlayers - 1) - 3 * eachSide
            let bs = 0, bt = 0
            if (leftPlayers == 1)
                bt = 1
            else if (leftPlayers == 2)
                bs = 1
            return {
                "top": eachSide + bt,
                "side": eachSide + bs,
            }
    }
}