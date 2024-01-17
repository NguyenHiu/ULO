import { createPlayerObject } from './player.js'
import { GetCard } from './const.js';

export function updateUI(CurrentPlayer, MyPlayerName, currentCardSlot) {
    let n = CurrentPlayer.ctx.noplayer;
    let names = [];
    let noCards = [];

    // sort players
    let pos = -1
    for (let i = 0; i < n; i++) {
        if (CurrentPlayer.ctx.playernames[i] == MyPlayerName) {
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

            names.push(CurrentPlayer.ctx.playernames[pos])
            noCards.push(CurrentPlayer.ctx.playernocards[pos])
            pos = (pos + 1) % n
        }

        let positions = calculatePositionOfPlayers(n)

        let left = document.getElementById("left")
        let right = document.getElementById("right")
        let top = document.getElementById("top")

        let i = 1
        right.innerHTML = ''
        for (let j = positions.side - 1; j >= 0; j--) {
            let obj = createPlayerObject(names[i + j], noCards[i + j])
            if (names[i + j] == CurrentPlayer.ctx.currentPlayerName)
                obj.className += " current-player"
            right.appendChild(obj)
        }
        i += positions.side

        top.innerHTML = ''
        for (let j = positions.top - 1; j >= 0; j--) {
            let obj = createPlayerObject(names[i + j], noCards[i + j])
            if (names[i + j] == CurrentPlayer.ctx.currentPlayerName)
                obj.className += " current-player"
            top.appendChild(obj)
        }
        i += positions.top

        left.innerHTML = ''
        for (let j = 0; j < positions.side; j++) {
            let obj = createPlayerObject(names[i + j], noCards[i + j])
            if (names[i + j] == CurrentPlayer.ctx.currentPlayerName)
                obj.className += " current-player"
            left.appendChild(obj)
        }
    } else {
        console.log("context: ");
        console.log(CurrentPlayer.ctx);
    }

    // this player 
    {
        let playerInfo = document.getElementById("player-info")
        let obj = createPlayerObject(MyPlayerName, CurrentPlayer.cards.length)
        if (MyPlayerName == CurrentPlayer.ctx.currentPlayerName)
            obj.className += " current-player"
        obj.style.margin = "5px"
        playerInfo.innerHTML = ''
        playerInfo.appendChild(obj)
    }

    // update player's cards
    let RemoveTheActiveCard = function (cardsRow1, cardsRow2) {
        for (let i = 0; i < cardsRow1.childNodes.length; i++) {
            if (cardsRow1.childNodes[i].firstChild.className.includes("active_card")) {
                cardsRow1.childNodes[i].firstChild.className = removeAClassName(cardsRow1.childNodes[i].firstChild.className, "active_card")
            }
        }
        for (let i = 0; i < cardsRow2.childNodes.length; i++) {
            if (cardsRow2.childNodes[i].firstChild.className.includes("active_card")) {
                cardsRow2.childNodes[i].firstChild.className = removeAClassName(cardsRow2.childNodes[i].firstChild.className, "active_card")
            }
        }
    }

    let CalculateCardPositionsInARow = function (noCards, cards, offset, parentObj, otherRow, cardsPos) {
        for (let i = 0; i < noCards; i++) {
            let card = GetCard(cards[i + offset].data)
            let cloneObj = card.cloneNode(true)
            cloneObj.style.left = (cardsPos[i] * 100 / cardsElementWidth).toString() + "%"
            cloneObj.onclick = function (e) {
                if (e.target.className.includes("active_card")) {
                    e.target.className = removeAClassName(e.target.className, "active_card")
                } else {
                    RemoveTheActiveCard(parentObj, otherRow)
                    e.target.className += " active_card"
                }

            }
            parentObj.appendChild(cloneObj)
        }
    }

    let cards1 = document.getElementById("cards-1")
    let cards2 = document.getElementById("cards-2")
    let no1 = parseInt(CurrentPlayer.cards.length / 2)
    let no2 = CurrentPlayer.cards.length - no1
    let cardWidth = 2 * document.documentElement.clientHeight / 30
    let cardsElementWidth = cards1.offsetWidth
    let cardPos1 = calculateCardsPositions(no1, cardsElementWidth, cardWidth)
    let cardPos2 = calculateCardsPositions(no2, cardsElementWidth, cardWidth)
    cards1.innerHTML = ''
    cards2.innerHTML = ''
    CalculateCardPositionsInARow(no1, CurrentPlayer.cards, 0, cards1, cards2, cardPos1)
    CalculateCardPositionsInARow(no2, CurrentPlayer.cards, no1, cards2, cards1, cardPos2)

    // update current card
    if (CurrentPlayer.ctx.currData.length != 1) {
        let card = GetCard(CurrentPlayer.ctx.currData)
        let cloneObj = card.firstChild.cloneNode(true)
        cloneObj.className += " current_card"
        currentCardSlot.innerHTML = ''
        currentCardSlot.appendChild(cloneObj)
    }
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