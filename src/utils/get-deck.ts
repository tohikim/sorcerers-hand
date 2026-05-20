import { figures, suits } from "../constants/cards";
import { NUMBER_OF_DECKS } from "../constants/variables";

export const getDeck = () => {
  const deck = [];

  for (let i = 0; i < suits.length * NUMBER_OF_DECKS; i++) {
    for (let j = 0; j < figures.length; j++) {
      deck.push(figures[j] + suits[i % suits.length]);
    }
  }
  return deck;
};
