

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
    constructor(currData, stack2, stack4, allowStack2, allowStack4, allowStack4Over2, noplayer, playernames, playernocards, currentPlayerName) {
        this.currData = currData
        this.stack2 = stack2
        this.stack4 = stack4
        this.allowStack2 = allowStack2
        this.allowStack4 = allowStack4
        this.allowStack4Over2 = allowStack4Over2
        this.noplayer = noplayer
        this.playernames = playernames
        this.playernocards = playernocards
        this.currentPlayerName = currentPlayerName
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

        console.log("checkNumCard()");
        console.log(" - currData:");
        console.log(this.ctx.currData);
        console.log(" - data: ");
        console.log(data);
        if (this.ctx.currData[1] == "num")
            return (this.ctx.currData[0] == data[0]) ||
                (this.ctx.currData[2] == data[2]);

        return this.ctx.currData[0] == data[0];
    }

    checkFunCard(data) {
        console.log("this.ctx.stack2: " + this.ctx.stack2.toString());
        console.log("this.ctx.stack4: " + this.ctx.stack4.toString());

        switch (data[2]) {
            case "change":
                return (this.ctx.stack2 == 0) && (this.ctx.stack4 == 0)

            case "skip":
            case "reverse":
                return (this.ctx.stack2 == 0) && (this.ctx.stack4 == 0) && (
                    (this.ctx.currData[2] == data[2]) ||
                    (this.ctx.currData[0] == data[0])
                )

            case "draw":
                if (this.ctx.currData[2] == "draw") {
                    if (data[3] == "2") {
                        return (this.ctx.currData[3] == "2") && this.ctx.allowStack2
                    } else if (data[3] == "4") {
                        return ((this.ctx.currData[3] == "4") && this.ctx.allowStack4) ||
                            ((this.ctx.currData[3] == "2") && this.ctx.allowStack4Over2)
                    } else {
                        alert("can not detect the card")
                    }
                } else {
                    return true;
                }

            default:
                alert("what kind of functional card is this???")
        }

        return false;
    }

    chooseColor() {
        document.getElementById("cover").style.visibility = "visible"
        document.getElementById("choose-color").style.visibility = "visible"
    }

    checkNextCardIsValid(data) {
        console.log("current Data: ");
        console.log(this.ctx.currData);

        // data: strng array
        if (this.ctx.currData[0] == "**")
            return false;
        else if (this.ctx.currData[0] == "*")
            return true;
        else if (data[1] == "num") {
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

    let chooseColor_red = document.getElementById("choose-color-red")
    let chooseColor_green = document.getElementById("choose-color-green")
    let chooseColor_blue = document.getElementById("choose-color-blue")
    let chooseColor_yellow = document.getElementById("choose-color-yellow")


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

        chooseColor_red.onclick = function (e) {
            let payload = {
                color: "red"
            }
            SendMessage("choose_color_response", payload)
            document.getElementById("choose-color").style.visibility = "hidden"
            document.getElementById("cover").style.visibility = "hidden"
        }


        chooseColor_green.onclick = function (e) {
            let payload = {
                color: "green"
            }
            SendMessage("choose_color_response", payload)
            document.getElementById("choose-color").style.visibility = "hidden"
            document.getElementById("cover").style.visibility = "hidden"
        }


        chooseColor_blue.onclick = function (e) {
            let payload = {
                color: "blue"
            }
            SendMessage("choose_color_response", payload)
            document.getElementById("choose-color").style.visibility = "hidden"
            document.getElementById("cover").style.visibility = "hidden"
        }


        chooseColor_yellow.onclick = function (e) {
            let payload = {
                color: "yellow"
            }
            SendMessage("choose_color_response", payload)
            document.getElementById("choose-color").style.visibility = "hidden"
            document.getElementById("cover").style.visibility = "hidden"
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
                    let obj = createPlayerObject(names[i + j], noCards[i + j])
                    if (names[i + j] == MyPlayer.ctx.currentPlayerName)
                        obj.className += " current-player"
                    right.appendChild(obj)
                }
                i += position.side

                top.innerHTML = ''
                for (let j = position.top - 1; j >= 0; j--) {
                    let obj = createPlayerObject(names[i + j], noCards[i + j])
                    if (names[i + j] == MyPlayer.ctx.currentPlayerName)
                        obj.className += " current-player"
                    top.appendChild(obj)
                }
                i += position.top

                left.innerHTML = ''
                for (let j = 0; j < position.side; j++) {
                    let obj = createPlayerObject(names[i + j], noCards[i + j])
                    if (names[i + j] == MyPlayer.ctx.currentPlayerName)
                        obj.className += " current-player"
                    left.appendChild(obj)
                }
            } else {
                console.log("context: ");
                console.log(MyPlayer.ctx);
            }

            // this player 
            {
                let playerInfo = document.getElementById("player-info")
                let obj = createPlayerObject(MyPlayerName, MyPlayer.cards.length)
                if (MyPlayerName == MyPlayer.ctx.currentPlayerName)
                    obj.className += " current-player"
                obj.style.margin = "5px"
                playerInfo.innerHTML = ''
                playerInfo.appendChild(obj)
            }

            // update player's cards
            let cards1 = document.getElementById("cards-1")
            let cards2 = document.getElementById("cards-2")
            let cardsElementWidth = cards1.offsetWidth
            let no1 = parseInt(MyPlayer.cards.length / 2)
            let no2 = MyPlayer.cards.length - no1
            let cardPos1 = calculateCardsPositions(no1, cardsElementWidth, 20 / 3 / (100 / document.documentElement.clientHeight))
            let cardPos2 = calculateCardsPositions(no2, cardsElementWidth, 20 / 3 / (100 / document.documentElement.clientHeight))
            cards1.innerHTML = ''
            cards2.innerHTML = ''
            for (let i = 0; i < no1; i++) {
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
                        else {
                            console.log("updateUI can not detect this card");
                            alert("updateUI() can not detect this type of card")
                        }
                    } else {
                        if (cardData == "skip")
                            card = cardObjs[cardType][cardColor][0]
                        else if (cardData == "reverse")
                            card = cardObjs[cardType][cardColor][1]
                        else if (cardData == "draw")
                            card = cardObjs[cardType][cardColor][2]
                        else {
                            console.log("updateUI can not detect this card");
                            alert("updateUI() can not detect this type of card")
                        }
                    }
                }
                let cloneObj = card.cloneNode(true)
                cloneObj.style.left = (cardPos1[i] * 100 / cardsElementWidth).toString() + "%"
                cloneObj.onclick = function (e) {
                    for (let i = 0; i < cards1.childElementCount; i++) {
                        if (cards1.childNodes[i].firstChild.className.includes("active_card")) {
                            cards1.childNodes[i].firstChild.className = removeAClassName(cards1.childNodes[i].firstChild.className, "active_card")
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
                        cardPos: Array.prototype.indexOf.call(cards1.childNodes, e.target.parentNode)
                    }
                    SendMessage("play_card", payload)
                }
                cards1.appendChild(cloneObj)
            }
            for (let i = 0; i < no2; i++) {
                let card
                let cardStr = MyPlayer.cards[i + no1].data
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
                        else {
                            console.log("updateUI can not detect this card");
                            alert("updateUI() can not detect this type of card")
                        }
                    } else {
                        if (cardData == "skip")
                            card = cardObjs[cardType][cardColor][0]
                        else if (cardData == "reverse")
                            card = cardObjs[cardType][cardColor][1]
                        else if (cardData == "draw")
                            card = cardObjs[cardType][cardColor][2]
                        else {
                            console.log("updateUI can not detect this card");
                            alert("updateUI() can not detect this type of card")
                        }
                    }
                }
                let cloneObj = card.cloneNode(true)
                cloneObj.style.left = (cardPos2[i] * 100 / cardsElementWidth).toString() + "%"
                cloneObj.onclick = function (e) {
                    for (let i = 0; i < cards2.childElementCount; i++) {
                        if (cards2.childNodes[i].firstChild.className.includes("active_card")) {
                            cards2.childNodes[i].firstChild.className = removeAClassName(cards2.childNodes[i].firstChild.className, "active_card")
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
                        cardPos: Array.prototype.indexOf.call(cards2.childNodes, e.target.parentNode)
                    }
                    SendMessage("play_card", payload)
                }
                cards2.appendChild(cloneObj)
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
                        else {
                            card = cardObjs["num"][cardColor][0]
                            // alert("updateUI() can not detect this type of card")
                        }
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
                    document.getElementsByTagName("body")[0].innerHTML = '404 not found, kaka'
                    break;

                case "init_player":
                    document.getElementById("data").hidden = false;
                    document.getElementById("login").hidden = true;
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

                case "choose_color":
                    MyPlayer.chooseColor()
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
    if (noCards <= 7) { }
    else if (noCards <= 12) {
        spaceBetween = -cardSize * 0.4;
    } else if (noCards <= 18) {
        spaceBetween = -cardSize * 0.6;
    } else {
        spaceBetween = -cardSize * 0.8;
    }
    let cardsWidth = noCards * cardSize + (noCards - 1) * spaceBetween
    let start = width / 2 - cardsWidth / 2
    let res = []
    for (let i = 0; i < noCards; i++) {
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

function createPlayerObject(name, noCards) {
    if (name.length > 6) {
        name = name.slice(0, 7)
    }

    let newObj = document.createElement("div")
    let p1 = document.createElement("p")
    p1.innerHTML = name
    let p2 = document.createElement("p")
    p2.innerHTML = noCards
    newObj.appendChild(p1)
    newObj.appendChild(p2)
    newObj.className += " player";

    return newObj
}