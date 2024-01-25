import { C } from './constants.js'

export class Context {
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

    // data: string array
    checkNextCardIsValid(card) {
        let data = card.split("-")
        let currdata = this.currData.split("-")
        if (currdata[C.COLOR] == "*")
            return false;
        else if (currdata[C.COLOR] == "+")
            return true;
        else if (data[C.TYPE] == C.NUM) {
            return this.checkNumCard(data);
        }
        else {
            return this.checkFunCard(data);
        }
    }

    // data: string array
    checkNumCard(data) {
        let currdata = this.currData.split("-")
        if ((this.stack2 != 0) || (this.stack4 != 0))
            return false;

        if (currdata[C.TYPE] == C.NUM)
            return (currdata[C.COLOR] == data[C.COLOR]) ||
                (currdata[C.DATA] == data[C.DATA]);

        return currdata[C.COLOR] == data[C.COLOR];
    }

    // data: string array
    checkFunCard(data) {
        let currdata = this.currData.split("-")
        switch (data[C.DATA]) {
            case "change":
                return (this.stack2 == 0) && (this.stack4 == 0)

            case "skip":
            case "reverse":
                return (this.stack2 == 0) && (this.stack4 == 0) && (
                    (currdata[C.DATA] == data[C.DATA]) ||
                    (currdata[C.COLOR] == data[C.COLOR])
                )

            case "draw":
                if (currdata[C.DATA] == "draw") {
                    if (data[C.PAR] == "2") {
                        return (currdata[C.PAR] == "2") && this.allowStack2
                    } else if (data[C.PAR] == "4") {
                        return ((currdata[C.PAR] == "4") && this.allowStack4) ||
                            ((currdata[C.PAR] == "2") && this.allowStack4Over2)
                    } else {
                        console.log("checkFunCard() can not detect the functional of drawing card")
                    }
                } else {
                    return true;
                }

            default:
                console.log("checkFunCard() can not detect the function of this card")
        }
        return false;
    }

}