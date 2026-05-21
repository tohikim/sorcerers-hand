import { figureValues } from "../constants/cards";
import { BUSTING_THRESHOLD } from "../constants/variables";
import type { Figures } from "../types/figures";

function initialCardCount(cards: string[]) {
  if (!cards) return 0;
  return cards.reduce((acc: number, cur: string) => {
    const currentHand = (cur ? cur[0] : "") as Figures;
    const currentValue = figureValues[currentHand] || 0;

    return acc + currentValue;
  }, 0);
}

export function getCardsCount(cards: string[]) {
  if (!cards) return 0;

  let aceCount = 0;
  let finalCount = initialCardCount(cards);

  for (const card of cards) {
    if (!card) continue;
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
