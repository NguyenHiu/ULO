import { C } from './const.js'

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
    checkNextCardIsValid(data) {
        if (this.currData[C.COLOR] == "**")
            return false;
        else if (this.currData[C.COLOR] == "*")
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
        if ((this.stack2 != 0) || (this.stack4 != 0))
            return false;

        if (this.currData[C.TYPE] == C.NUM)
            return (this.currData[C.COLOR] == data[C.COLOR]) ||
                (this.currData[C.DATA] == data[C.DATA]);

        return this.currData[C.COLOR] == data[C.COLOR];
    }

    // data: string array
    checkFunCard(data) {
        switch (data[C.DATA]) {
            case "change":
                return (this.stack2 == 0) && (this.stack4 == 0)

            case "skip":
            case "reverse":
                return (this.stack2 == 0) && (this.stack4 == 0) && (
                    (this.currData[C.DATA] == data[C.DATA]) ||
                    (this.currData[C.COLOR] == data[C.COLOR])
                )

            case "draw":
                if (this.currData[C.DATA] == "draw") {
                    if (data[C.PAR] == "2") {
                        return (this.currData[C.PAR] == "2") && this.allowStack2
                    } else if (data[C.PAR] == "4") {
                        return ((this.currData[C.PAR] == "4") && this.allowStack4) ||
                            ((this.currData[C.PAR] == "2") && this.allowStack4Over2)
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

}