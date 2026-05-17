import { figureValues } from "../constants/cards";
import type { Figures } from "../types/figures";

export function getCardsCount(cards: string[]) {
  return cards.reduce((acc, cur) => {
    const currentFigure = cur[0] as Figures;
    const currentValue = figureValues[currentFigure];
    return acc + currentValue;
  }, 0);
}
