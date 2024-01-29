import { Cards, NewPlayerRow, Obj } from './constants.js';

export function updateUI(PlayerData) {
    // sort player list
    let pos = -1
    for (let i = 0; i < PlayerData.Data.ctx.noplayer; i++) {
        if (PlayerData.Data.ctx.playernames[i] == PlayerData.Name) {
            pos = i
        }
    }

    let callUNO = []
    if (pos != -1) {
        let _count = 0;
        let names = [];
        let noCards = [];
        while (names.length < PlayerData.Data.ctx.noplayer) {
            if (_count > PlayerData.Data.ctx.noplayer) {
                console.log("While loop in updateUI() is an infinite loop!")
                return
            }
            _count++;

            names.push(PlayerData.Data.ctx.playernames[pos])
            noCards.push(PlayerData.Data.ctx.playernocards[pos])
            pos = (pos + 1) % PlayerData.Data.ctx.noplayer
        }

        for (let i = 0; i < names.length; i++) {
            callUNO[i] = false;
            for (let j = 0; j < PlayerData.Data.ctx.unonames.length; j++) {
                if (names[i] == PlayerData.Data.ctx.unonames[j]) {
                    callUNO[i] = true;
                    break;
                }
            }
        }

        Obj.RightSideBoard.innerHTML = ''
        Obj.LeftSideBoard.innerHTML = ''
        Obj.TopSideBoard.innerHTML = ''
        let positions = SetupPlayerPosition(PlayerData.Data.ctx.noplayer)
        let i = 1

        for (let j = positions.side - 1; j >= 0; j--) {
            let tmp = NewPlayerRow(names[i + j], noCards[i + j], PlayerData.Data.ctx.currentPlayerName, callUNO[i])
            tmp.onclick = function (e) {
                playerOnclickFunc(e, PlayerData)
            }
            Obj.RightSideBoard.appendChild(tmp)
        }
        i += positions.side

        for (let j = positions.top - 1; j >= 0; j--) {
            let tmp = NewPlayerRow(names[i + j], noCards[i + j], PlayerData.Data.ctx.currentPlayerName, callUNO[i])
            tmp.onclick = function (e) {
                playerOnclickFunc(e, PlayerData)
            }
            Obj.TopSideBoard.appendChild(tmp)
        }
        i += positions.top

        for (let j = 0; j < positions.side; j++) {
            let tmp = NewPlayerRow(names[i + j], noCards[i + j], PlayerData.Data.ctx.currentPlayerName, callUNO[i])
            tmp.onclick = function (e) {
                playerOnclickFunc(e, PlayerData)
            }
            Obj.LeftSideBoard.appendChild(tmp)
        }
    } else {
        console.log("updateUI(): can not found player name, context: ")
        console.log(CurrentPlayer.ctx);
    }

    // this player 
    Obj.CurrentPlayerSlot.innerHTML = ''
    Obj.CurrentPlayerSlot.appendChild(NewPlayerRow(PlayerData.Name, PlayerData.Data.cards.length, PlayerData.Data.ctx.currentPlayerName, callUNO[0]))

    // update player's cards
    Obj.UpperCardSet.innerHTML = ''
    Obj.BelowCardSet.innerHTML = ''
    if (PlayerData.Data.cards.length <= 17) {
        for (let i = 0; i < PlayerData.Data.cards.length; i++) {
            let tmp = Cards[PlayerData.Data.cards[i].id].cloneNode(true)
            tmp.onclick = CardOnclick
            Obj.UpperCardSet.appendChild(tmp)
        }
    } else {
        let amountUpper = parseInt(PlayerData.Data.cards.length / 2)
        let i = 0;
        for (; i < amountUpper; i++) {
            let tmp = Cards[PlayerData.Data.cards[i].id].cloneNode(true)
            tmp.onclick = CardOnclick
            Obj.UpperCardSet.appendChild(tmp)
        }
        for (; i < PlayerData.Data.cards.length; i++) {
            let tmp = Cards[PlayerData.Data.cards[i].id].cloneNode(true)
            tmp.onclick = CardOnclick
            Obj.BelowCardSet.appendChild(tmp)
        }
    }

    // update current card
    if (PlayerData.Data.ctx.currData != "*") {
        let tmp = Cards[PlayerData.Data.ctx.currData].cloneNode(true)
        tmp.className += " m-curr-card"
        Obj.CurrentCardSlot.innerHTML = ''
        Obj.CurrentCardSlot.appendChild(tmp)
    }
}

function SetupPlayerPosition(noPlayers) {
    let n = (noPlayers - 1) / 3
    let r = n - parseInt(n)
    n = parseInt(n)
    if (r == 0) return { top: n, side: n }
    else if (r < 0.5) return { top: n + 1, side: n }
    else return { top: n, side: n + 1 }
}

export function ChooseColorTrigger() {
    Obj.ChooseColorLayout.hidden = false
}

let CardOnclick = function (e) {
    let activeCard = document.getElementsByClassName("m-active-card")[0]
    // console.log("active card: ");
    // console.log(activeCard);
    if (activeCard != null) activeCard.className = activeCard.className.replace("m-active-card", "")
    e.target.className += "m-active-card"
}

let playerOnclickFunc = function (e, playerData) {
    playerData.SC.send(JSON.stringify({
        type: "uno_punish",
        payload: {
            name: e.target.innerHTML.split(",")[0]
        }
    }))
}