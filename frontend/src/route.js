import { Context } from './context.js'
import { Card } from './const.js'
import { updateUI } from './utils.js'

export function routeEvent(event, CurrentPlayer, PlayerName, currentCardSlot) {
    if (event.type === undefined) {
        alert("no type field in the event");
        return;
    }

    switch (event.type) {
        case "game_is_playing":
            alert("the game is playing, u can not join")
            CONN.close()
            document.getElementsByTagName("body")[0].innerHTML = '404 not found, kaka'
            break;

        case "init_player":
            document.getElementById("data").hidden = false;
            document.getElementById("login").hidden = true;
            CurrentPlayer.id = event.payload.id
            // cards
            for (let i = 0; i < event.payload.cards.length; i++) {
                console.log("event.payload.cards[i]:");
                console.log(event.payload.cards[i]);
                CurrentPlayer.cards[i] = new Card(event.payload.cards[i].data)
            }
            // ctx
            CurrentPlayer.ctx = Object.assign(new Context, event.payload.ctx)
            updateUI(CurrentPlayer, PlayerName, currentCardSlot);
            break;

        case "update_state":
            let newCTX = Object.assign(new Context, event.payload)
            CurrentPlayer.setNewContext(newCTX)
            updateUI(CurrentPlayer, PlayerName, currentCardSlot);
            break;

        case "update_cards":
            CurrentPlayer.cards = []
            CurrentPlayer.addNewCards(event.payload)
            updateUI(CurrentPlayer, PlayerName, currentCardSlot);
            break;

        case "choose_color":
            CurrentPlayer.chooseColorTrigger()
            break;

        case "end_game":
            alert("player '" + event.payload.winner + "' has 0 card. End game!")
            SendMessage("close_connect", {})
            CONN.close();
            location.reload();
            break;

        default:
            alert("do not support this type of message");
            break;
    }

}