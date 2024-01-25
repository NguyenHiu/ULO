
// export 

export const C = {
    COLOR: 0,
    TYPE: 1,
    DATA: 2,
    PAR: 3,
    NUM: "num",
    FUN: "fun",
    SEPARATOR: "-",
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

// export class Card {
//     constructor(raw) {
//         this.id = raw
//     }
// }

export const Obj = {
    LoginInput: document.getElementById("m-login-name-input"),
    LoginButton: document.getElementById("m-login-submit-button"),
    LoginPage: document.getElementById("m-login-page"),
    GameBoard: document.getElementById("m-game-board"),
    UpperCardSet: document.getElementById("m-upper-set-of-cards"),
    BelowCardSet: document.getElementById("m-below-set-of-cards"),
    DrawButton: document.getElementById("m-button-draw"),
    PlayButton: document.getElementById("m-button-play"),
    UnoButton: document.getElementById("m-button-call-uno"),
    ColorRed: document.getElementById("m-cc-red"),
    ColorGreen: document.getElementById("m-cc-green"),
    ColorBlue: document.getElementById("m-cc-blue"),
    ColorYellow: document.getElementById("m-cc-yellow"),
    ChooseColorLayout: document.getElementById("m-choose-color"),
    CurrentCardSlot: document.getElementById("m-curr-card-slot"),
    LeftSideBoard: document.getElementById("m-left-col"),
    RightSideBoard: document.getElementById("m-right-col"),
    TopSideBoard: document.getElementById("m-top-row"),
    CurrentPlayerSlot: document.getElementById("m-curr-player-slot"),
    DrawOrSkip: document.getElementById("m-drawed-card-switch"),
    DrawedCardSlot: document.getElementById("m-drawed-card-slot"),
    DrawedButtonPlay: document.getElementById("m-button-drawed-play"),
    DrawedButtonSkip: document.getElementById("m-button-drawed-skip"),
}

export const Cards = {
    "+-+": document.getElementById("+-+"),
    "red-+": document.getElementById("red-+"),
    "green-+": document.getElementById("green-+"),
    "blue-+": document.getElementById("blue-+"),
    "yellow-+": document.getElementById("yellow-+"),
    "blue-num-0": document.getElementById("blue-num-0"),
    "blue-num-1": document.getElementById("blue-num-1"),
    "blue-num-2": document.getElementById("blue-num-2"),
    "blue-num-3": document.getElementById("blue-num-3"),
    "blue-num-4": document.getElementById("blue-num-4"),
    "blue-num-5": document.getElementById("blue-num-5"),
    "blue-num-6": document.getElementById("blue-num-6"),
    "blue-num-7": document.getElementById("blue-num-7"),
    "blue-num-8": document.getElementById("blue-num-8"),
    "blue-num-9": document.getElementById("blue-num-9"),
    "blue-fun-draw-2": document.getElementById("blue-fun-draw-2"),
    "blue-fun-reverse": document.getElementById("blue-fun-reverse"),
    "blue-fun-skip": document.getElementById("blue-fun-skip"),
    "red-num-0": document.getElementById("red-num-0"),
    "red-num-1": document.getElementById("red-num-1"),
    "red-num-2": document.getElementById("red-num-2"),
    "red-num-3": document.getElementById("red-num-3"),
    "red-num-4": document.getElementById("red-num-4"),
    "red-num-5": document.getElementById("red-num-5"),
    "red-num-6": document.getElementById("red-num-6"),
    "red-num-7": document.getElementById("red-num-7"),
    "red-num-8": document.getElementById("red-num-8"),
    "red-num-9": document.getElementById("red-num-9"),
    "red-fun-draw-2": document.getElementById("red-fun-draw-2"),
    "red-fun-reverse": document.getElementById("red-fun-reverse"),
    "red-fun-skip": document.getElementById("red-fun-skip"),
    "green-num-0": document.getElementById("green-num-0"),
    "green-num-1": document.getElementById("green-num-1"),
    "green-num-2": document.getElementById("green-num-2"),
    "green-num-3": document.getElementById("green-num-3"),
    "green-num-4": document.getElementById("green-num-4"),
    "green-num-5": document.getElementById("green-num-5"),
    "green-num-6": document.getElementById("green-num-6"),
    "green-num-7": document.getElementById("green-num-7"),
    "green-num-8": document.getElementById("green-num-8"),
    "green-num-9": document.getElementById("green-num-9"),
    "green-fun-draw-2": document.getElementById("green-fun-draw-2"),
    "green-fun-reverse": document.getElementById("green-fun-reverse"),
    "green-fun-skip": document.getElementById("green-fun-skip"),
    "yellow-num-0": document.getElementById("yellow-num-0"),
    "yellow-num-1": document.getElementById("yellow-num-1"),
    "yellow-num-2": document.getElementById("yellow-num-2"),
    "yellow-num-3": document.getElementById("yellow-num-3"),
    "yellow-num-4": document.getElementById("yellow-num-4"),
    "yellow-num-5": document.getElementById("yellow-num-5"),
    "yellow-num-6": document.getElementById("yellow-num-6"),
    "yellow-num-7": document.getElementById("yellow-num-7"),
    "yellow-num-8": document.getElementById("yellow-num-8"),
    "yellow-num-9": document.getElementById("yellow-num-9"),
    "yellow-fun-draw-2": document.getElementById("yellow-fun-draw-2"),
    "yellow-fun-reverse": document.getElementById("yellow-fun-reverse"),
    "yellow-fun-skip": document.getElementById("yellow-fun-skip"),
    "+-fun-change": document.getElementById("+-fun-change"),
    "+-fun-draw-4": document.getElementById("+-fun-draw-4"),
}


let templates = document.getElementById("tpl").children
const Templates = {
    Card: templates[0],
    Player: templates[1],
}

export function NewPlayerRow(name, amount, triggeredName) {
    let tmp = Templates.Player.cloneNode(true)
    tmp.children[0].innerHTML = name + ", " + amount
    if (name == triggeredName)
        tmp.className += " m-active-player"
    return tmp
}

export function NewCardRepresentation(id) {
    let tmp1 = Cards[id].cloneNode(true);
    tmp1.style.width = "100%";
    let tmp2 = Templates.Card.cloneNode(true)
    tmp2.appendChild(tmp1)
    return tmp2
}
