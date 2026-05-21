import type { Figures } from "../types/figures";

export const suits = ["s", "c", "h", "d"];
export const figures = [
  "A",
  "2",
  // "3",
  // "4",
  // "5",
  // "6",
  // "7",
  // "8",
  // "9",
  // "T",
  // "J",
  // "Q",
  // "K",
];
export const figureValues: {
  [key in Figures]: number;
} = {
  A: 11,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  T: 10,
  J: 10,
  Q: 10,
  K: 10,
};
