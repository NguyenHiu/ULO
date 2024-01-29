import { Context } from './context.js'
import { Cards, Obj } from './constants.js'
import { ChooseColorTrigger, updateUI } from './utils.js'

export function routeEvent(event, PlayerData) {
    if (event.type === undefined) {
        console.log("Invalid Event's Type")
        return
    }

    switch (event.type) {
        case "game_is_playing":
            alert("The game is currently in progress")
            PlayerData.SC.close()
            document.getElementsByTagName("body")[0].innerHTML = '<h1>404 NOT FOUND<h1>'
            break;

        case "init_player":
            Obj.LoginPage.hidden = true
            Obj.GameBoard.hidden = false

            PlayerData.Data.id = event.payload.id
            PlayerData.Data.cards = event.payload.cards
            PlayerData.Data.ctx = Object.assign(new Context, event.payload.ctx)
            updateUI(PlayerData)
            break

        case "exist_player_username":
            alert("Exist this username in the game, please uses different name")
            break

        case "update_state":
            let newCTX = Object.assign(new Context, event.payload)
            PlayerData.Data.setNewContext(newCTX)
            updateUI(PlayerData)
            break

        case "update_cards":
            PlayerData.Data.cards = []
            PlayerData.Data.addNewCards(event.payload)
            console.log("payload: ");
            console.log(event.payload);
            updateUI(PlayerData)
            break

        case "choose_color":
            ChooseColorTrigger();
            break

        case "draw_1_skip_or_play":
            let tmp = Cards[event.payload.id].cloneNode(true)
            tmp.className += " m-drawed-card"
            Obj.DrawedCardSlot.innerHTML = ''
            Obj.DrawedCardSlot.appendChild(tmp)
            Obj.DrawOrSkip.hidden = false;
            break

        case "end_game":
            PlayerData.SC.send(JSON.stringify(new Event("close_connect", {})))
            PlayerData.SC.close()
            alert(event.payload.winner + " wins.")
            location.reload()
            break

        default:
            console.log("Event does not support this type, type: " + event.type)
            break
    }

}