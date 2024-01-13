package server

func RemoveACard(cards []Card, index int) []Card {
	var c []Card
	c = append(c, cards[:index]...)
	c = append(c, cards[index+1:]...)
	return c
}