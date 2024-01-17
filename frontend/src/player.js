import { Card } from './const.js'

export class Player {
    constructor(id = 0, cards = [], ctx = "") {
        this.id = id
        this.cards = cards
        this.ctx = ctx
    }

    setNewContext(newCTX) {
        this.ctx = newCTX
    }

    // data: string array
    checkNextCardIsValid(data) {
        console.log("this ctx");
        console.log(this.ctx);
        return this.ctx.checkNextCardIsValid(data)
    }

    chooseColorTrigger() {
        document.getElementById("cover").style.visibility = "visible"
        document.getElementById("choose-color").style.visibility = "visible"
    }

    addNewCards(cards) {
        for (let i = 0; i < cards.length; i++) {
            this.cards.push(new Card(cards[i].data))
        }
    }
}

export function createPlayerObject(name, noCards) {
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