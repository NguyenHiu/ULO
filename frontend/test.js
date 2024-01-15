

function calculateCardsPositions(noCards, width) {
    let spaceBetween = 0
    if (noCards <= 10) { }
    else if (noCards <= 20) {
        spaceBetween = -40;
    } else if (noCards <= 30) {
        spaceBetween = -60;
    } else {
        spaceBetween = -80;
    }
    let cardsWidth = noCards * 100 - (noCards - 1) * spaceBetween
    let start = width / 2 - cardsWidth / 2
    let res = []
    for (let i = 0; i < noCards; i++) {
        res.push(start + i * 100 - spaceBetween)
    }
    return res
}

console.log(calculateCardsPositions(9, 1000));