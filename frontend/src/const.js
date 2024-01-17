
export const C = {
    COLOR: 0,
    TYPE: 1,
    DATA: 2,
    PAR: 3,
    NUM: "num",
    FUN: "fun",
    SV_SEPARATOR: ":",
    FE_SEPARATOR: "-",
    R: "red",
    G: "green",
    B: "blue",
    Y: "yellow"
}


export class Event {
    constructor(type, payload) {
        this.type = type;
        this.payload = payload;
    }
}

export class Card {
    constructor(raw) {
        this.data = raw.split(C.SV_SEPARATOR)
    }
}

export let GetCard = function (cardData) {
    let card
    if (cardData[C.TYPE] == C.NUM)
        card = cardObjs[cardData[C.TYPE]][cardData[C.COLOR]][parseInt(cardData[C.DATA])]
    else if (cardData[C.TYPE] == C.FUN) { // fun
        if (cardData[C.COLOR] == "*") {
            if (cardData[C.DATA] == "draw")
                card = cardObjs[cardData[C.TYPE]][cardData[C.COLOR]][0]
            else if (cardData[C.DATA] == "change")
                card = cardObjs[cardData[C.TYPE]][cardData[C.COLOR]][1]
            else {
                alert("updateUI() can not detect this type of card")
            }
        } else {
            if (cardData[C.DATA] == "skip")
                card = cardObjs[cardData[C.TYPE]][cardData[C.COLOR]][0]
            else if (cardData[C.DATA] == "reverse")
                card = cardObjs[cardData[C.TYPE]][cardData[C.COLOR]][1]
            else if (cardData[C.DATA] == "draw")
                card = cardObjs[cardData[C.TYPE]][cardData[C.COLOR]][2]
            else {
                alert("updateUI() can not detect this type of card")
            }
        }
    } else if (cardData[C.TYPE] == "*") {
        card = cardObjs[C.NUM][cardData[C.COLOR]][0]
    }
    return card
}

export let cardObjs = {
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
let d = document.createElement("div")
d.className = "card"
let colors = [C.R, C.G, C.B, C.Y]
for (let colorIdx = 0; colorIdx < 4; colorIdx++) {
    let color = colors[colorIdx]
    for (let cardIdx = 0; cardIdx < 10; cardIdx++) {
        let obj = d.cloneNode()
        obj.appendChild(document.getElementById(color + "-num-" + cardIdx.toString()).cloneNode())
        cardObjs[C.NUM][color].push(obj)
    }
    let funskip = d.cloneNode()
    funskip.appendChild(document.getElementById(color + "-fun-skip").cloneNode())
    cardObjs[C.FUN][color].push(funskip)
    let funreverse = d.cloneNode()
    funreverse.appendChild(document.getElementById(color + "-fun-reverse").cloneNode())
    cardObjs[C.FUN][color].push(funreverse)
    let fundraw2 = d.cloneNode()
    fundraw2.appendChild(document.getElementById(color + "-fun-draw-2").cloneNode())
    cardObjs[C.FUN][color].push(fundraw2)
}
let fundraw4 = d.cloneNode()
fundraw4.appendChild(document.getElementById("+-fun-draw-4").cloneNode())
cardObjs[C.FUN]["*"].push(fundraw4)
let funchange = d.cloneNode()
funchange.appendChild(document.getElementById("+-fun-change").cloneNode())
cardObjs[C.FUN]["*"].push(funchange)