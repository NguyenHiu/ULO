
function calculatePositionOfPlayers(noPlayers) {
    switch (noPlayers) {
        case 1:
            return { "top": [], "left": [], "right": [] }
        case 2:
            return { "top": [1], "left": [], "right": [] }
        case 3:
            return { "top": [], "left": [2], "right": [1] }
        default:
            let eachSide = parseInt((noPlayers - 1) / 3)
            let leftPlayers = (noPlayers - 1) - 3 * eachSide
            let bl = 0, br = 0, bt = 0
            if (leftPlayers == 1)
                bt = 1
            else if (leftPlayers == 2)
                bl = br = 1
            let left = [], right = [], top = []
            let i = 1
            while (i <= eachSide + br)
                right.push(i++)
            while (i <= eachSide * 2 + br + bt)
                top.push(i++)
            while (i <= eachSide * 3 + br + bt + bl)
                left.push(i++)
            return {
                "top": top,
                "left": left,
                "right": right,
            }
    }

}


console.log(calculatePositionOfPlayers(5));