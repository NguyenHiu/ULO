

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
    constructor(id, cards, ctx) {
        this.id = id
        this.cards = cards
        this.ctx = ctx
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

    // vars
    let CONN = new WebSocket("ws://" + document.location.host + "/ws")
    let MyPlayer = new Player()
    let MyPlayerName = ""

    // html elements
    let name = document.getElementById("nameInput");
    let nameBTN = document.getElementById("nameButton");
    let curretnCardSlot = document.getElementById("current_card_slot")
    let drawBtn = document.getElementById("btn_draw")


    let cardObjs = {
        "num": {
            "blue": [],
            "red": [],
            "yellow": [],
            "green": [],
        },
        "fun": {
            "*": [],
            "blue": [],
            "red": [],
            "yellow": [],
            "green": [],
        }
    }
    let colors = ["red", "green", "blue", "yellow"]
    let d = document.createElement("div")
    d.className = "card"
    for (let colorIdx = 0; colorIdx < 4; colorIdx++) {
        let color = colors[colorIdx]
        for (let cardIdx = 0; cardIdx < 10; cardIdx++) {
            let obj = d.cloneNode()
            obj.appendChild(document.getElementById(color + "-num-" + cardIdx.toString()).cloneNode())
            cardObjs["num"][color].push(obj)
        }

        let funskip = d.cloneNode()
        funskip.appendChild(document.getElementById(color + "-fun-skip").cloneNode())
        cardObjs["fun"][color].push(funskip)

        let funreverse = d.cloneNode()
        funreverse.appendChild(document.getElementById(color + "-fun-reverse").cloneNode())
        cardObjs["fun"][color].push(funreverse)

        let fundraw2 = d.cloneNode()
        fundraw2.appendChild(document.getElementById(color + "-fun-draw-2").cloneNode())
        cardObjs["fun"][color].push(fundraw2)
    }

    let fundraw4 = d.cloneNode()
    fundraw4.appendChild(document.getElementById("+-fun-draw-4").cloneNode())
    cardObjs["fun"]["*"].push(fundraw4)

    let funchange = d.cloneNode()
    funchange.appendChild(document.getElementById("+-fun-change").cloneNode())
    cardObjs["fun"]["*"].push(funchange)

    nameBTN.disabled = true;
    setTimeout(function () {
        nameBTN.disabled = false;

        drawBtn.onclick = function (e) {
            let n = 1
            if (MyPlayer.ctx.stack2 != 0 || MyPlayer.ctx.stack4 != 0) {
                n = MyPlayer.ctx.stack2 * 2 + MyPlayer.ctx.stack4 * 4
            }
            SendMessage("draw_cards", {
                from: MyPlayer.id,
                amount: n
            })
        }

        nameBTN.onclick = function (e) {
            if (name.value == "") {
                alert("name field is empty")
                return
            }

            MyPlayerName = name.value;

            document.getElementById("data").hidden = false;
            document.getElementById("login").hidden = true;

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
            let pos = -1
            for (let i = 0; i < n; i++) {
                if (MyPlayer.ctx.playernames[i] == MyPlayerName) {
                    pos = i
                }
            }
            if (pos != -1) {
                let _count = 0;
                while (names.length < n) {
                    if (_count > n) {
                        alert("while loop in updateUI() is an infinite loop")
                    }
                    _count++;

                    names.push(MyPlayer.ctx.playernames[pos])
                    noCards.push(MyPlayer.ctx.playernocards[pos])
                    pos = (pos + 1) % n
                }

                let position = calculatePositionOfPlayers(n)

                let left = document.getElementById("left")
                let right = document.getElementById("right")
                let top = document.getElementById("top")

                let i = 1
                right.innerHTML = ''
                for (let j = position.side - 1; j >= 0; j--) {
                    let newObj = document.createElement("p")
                    newObj.innerText = names[i + j] + ", " + noCards[i + j]
                    right.appendChild(newObj)
                }
                i += position.side

                top.innerHTML = ''
                for (let j = position.top - 1; j >= 0; j--) {
                    let newObj = document.createElement("p")
                    newObj.innerText = names[i + j] + ", " + noCards[i + j]
                    top.appendChild(newObj)
                }
                i += position.top

                left.innerHTML = ''
                for (let j = 0; j < position.side; j++) {
                    let newObj = document.createElement("p")
                    newObj.innerText = names[i + j] + ", " + noCards[i + j]
                    left.appendChild(newObj)
                }
            } else {
                console.log("context: ");
                console.log(MyPlayer.ctx);
            }

            // update player's cards
            let cardsElement = document.getElementById("cards")
            let cardsElementWidth = cardsElement.offsetWidth
            console.log("cardsElemetnWidth: " + cardsElementWidth.toString());
            let cardPos = calculateCardsPositions(MyPlayer.cards.length, cardsElementWidth, 10 / (100 / document.documentElement.clientWidth))
            cardsElement.innerHTML = ''
            for (let i = 0; i < MyPlayer.cards.length; i++) {
                let card
                let cardStr = MyPlayer.cards[i].data
                let cardColor = cardStr[0]
                let cardType = cardStr[1]
                let cardData = cardStr[2]

                if (cardType == "num")
                    card = cardObjs[cardType][cardColor][parseInt(cardData)]
                else { // fun
                    if (cardColor == "*") {
                        if (cardData == "draw")
                            card = cardObjs[cardType][cardColor][0]
                        else if (cardData == "change")
                            card = cardObjs[cardType][cardColor][1]
                        else
                            alert("updateUI() can not detect this type of card")
                    } else {
                        if (cardData == "skip")
                            card = cardObjs[cardType][cardColor][0]
                        else if (cardData == "reverse")
                            card = cardObjs[cardType][cardColor][1]
                        else if (cardData == "draw")
                            card = cardObjs[cardType][cardColor][2]
                        else
                            alert("updateUI() can not detect this type of card")
                    }
                }
                let cloneObj = card.cloneNode(true)
                cloneObj.style.left = (cardPos[i] * 100 / cardsElementWidth).toString() + "%"
                cloneObj.onclick = function (e) {
                    console.log(cardsElement.childNodes);
                    for (let i = 0; i < cardsElement.childElementCount; i++) {
                        if (cardsElement.childNodes[i].firstChild.className.includes("active_card")) {
                            cardsElement.childNodes[i].firstChild.className = removeAClassName(cardsElement.childNodes[i].firstChild.className, "active_card")
                        }
                    }

                    e.target.className += " active_card"
                }
                cloneObj.ondblclick = function (e) {
                    console.log("e.target.id" + e.target.id.toString());
                    let data = e.target.id.replace("+", "*").split("-")
                    if (!MyPlayer.checkNextCardIsValid(data)) {
                        alert("you can not play this card")
                        return
                    }

                    let payload = {
                        id: MyPlayer.id,
                        card: data,
                        cardPos: Array.prototype.indexOf.call(cardsElement.childNodes, e.target.parentNode)
                    }
                    SendMessage("play_card", payload)
                }
                cardsElement.appendChild(cloneObj)
            }


            // update current card
            let card
            if (MyPlayer.ctx.currData.length != 1) {
                let cardStr = MyPlayer.ctx.currData
                let cardColor = cardStr[0]
                let cardType = cardStr[1]
                let cardData = cardStr[2]
                if (cardType == "num")
                    card = cardObjs[cardType][cardColor][parseInt(cardData)]
                else { // fun
                    if (cardColor == "*") {
                        if (cardData == "draw")
                            card = cardObjs[cardType][cardColor][0]
                        else if (cardData == "change")
                            card = cardObjs[cardType][cardColor][1]
                        else
                            alert("updateUI() can not detect this type of card")
                    } else {
                        if (cardData == "skip")
                            card = cardObjs[cardType][cardColor][0]
                        else if (cardData == "reverse")
                            card = cardObjs[cardType][cardColor][1]
                        else if (cardData == "draw")
                            card = cardObjs[cardType][cardColor][2]
                        else
                            alert("updateUI() can not detect this type of card")
                    }
                }
                let cloneObj = card.firstChild.cloneNode(true)
                cloneObj.className += " current_card"
                curretnCardSlot.innerHTML = ''
                curretnCardSlot.appendChild(cloneObj)
            }
        }
        function routeEvent(event) {
            if (event.type === undefined) {
                alert("no type field in the event");
                return;
            }

            switch (event.type) {
                case "game_is_playing":
                    console.log("123");
                    alert("the game is playing, u can not join")
                    CONN.close()
                    document.getElementById("data").hidden = true;
                    document.getElementById("login").hidden = false;
                    break;

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
            console.log("SendMessage()");
            console.log(event);
            CONN.send(JSON.stringify(event))
        }


        CONN.onmessage = function (e) {
            let data = JSON.parse(e.data);
            let event = Object.assign(new Event, data);
            console.log("on receive: ");
            console.log(event);
            routeEvent(event);
        }

    }, 2000)
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


function calculateCardsPositions(noCards, width, cardSize) {
    let spaceBetween = 0
    if (noCards <= 8) { }
    else if (noCards <= 15) {
        spaceBetween = -cardSize * 0.4;
    } else if (noCards <= 20) {
        spaceBetween = -cardSize * 0.6;
    } else {
        spaceBetween = -cardSize * 0.8;
    }
    let cardsWidth = noCards * cardSize + (noCards - 1) * spaceBetween
    console.log("cardsWidth: " + cardsWidth.toString());
    console.log("width: " + width.toString());
    let start = width / 2 - cardsWidth / 2
    let res = []
    for (let i = 0; i < noCards; i++) {
        console.log(start + i * (cardSize + spaceBetween));
        res.push(start + i * (cardSize + spaceBetween))
    }
    return res
}

function removeAClassName(className, needtoberemoved) {
    let str = className.split(" ")
    if (str.length != 0) {
        let newClassName = ""
        for (let i = 0; i < str.length; i++) {
            if (str[i] != needtoberemoved)
                newClassName += str[i] + " "
        }
        return newClassName
    }
    return className
}