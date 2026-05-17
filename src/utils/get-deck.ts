import { figures, suits } from "../constants/cards";

export const getDeck = () => {
  const deck = [];

  for (let i = 0; i < suits.length; i++) {
    for (let j = 0; j < figures.length; j++) {
      deck.push(figures[j] + suits[i]);
    }
  }
  return deck;
};
