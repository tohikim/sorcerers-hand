import { BUSTING_THRESHOLD, figureValues } from "../constants/cards";
import type { Figures } from "../types/figures";

function initialCardCount(cards: string[]) {
  return cards.reduce((acc, cur) => {
    const currentFigure = cur[0] as Figures;
    const currentValue = figureValues[currentFigure];

    return acc + currentValue;
  }, 0);
}

export function getCardsCount(cards: string[]) {
  let aceCount = 0;
  let finalCount = initialCardCount(cards);

  for (const card of cards) {
    const currentFigure = card[0] as Figures;
    if (currentFigure === "A") {
      aceCount++;
    }
  }

  while (finalCount > BUSTING_THRESHOLD && aceCount > 0) {
    finalCount -= 10;
    aceCount--;
  }

  return finalCount;
}
