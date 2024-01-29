export class Player {
    constructor(id = 0, cards = [], ctx = "") {
        this.id = id
        this.cards = cards
        this.ctx = ctx
    }

    setNewContext(newCTX) {
        this.ctx = newCTX
    }

    addNewCards(cards) {
        if (cards != null) {
            for (let i = 0; i < cards.length; i++) {
                this.cards.push(cards[i])
            }
        }
    }
}