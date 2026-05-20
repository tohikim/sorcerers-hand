import { useEffect, useState } from "react";
import { BUSTING_THRESHOLD } from "../constants/variables";
import { getCardsCount } from "../utils/get-cards-count";
import type { GameState } from "../types/game-state";

export interface PlayerHandProps {
  cards: string[];
  totalHouseCount: number;
  isActive: boolean;
  handEnded: boolean;
}

export const PlayerHand = ({
  cards,
  totalHouseCount,
  isActive,
  handEnded,
}: PlayerHandProps) => {
  const totalPlayerCount = getCardsCount(cards);
  const isPlayerBusted = totalPlayerCount > BUSTING_THRESHOLD;

  const isHouseBusted = totalHouseCount > BUSTING_THRESHOLD;

  const [handState, setHandState] = useState<GameState>();

  useEffect(() => {
    if (!handEnded || isPlayerBusted) {
      setHandState(undefined);

      return;
    }

    switch (true) {
      case isHouseBusted:
        setHandState("won");
        break;
      case totalPlayerCount === totalHouseCount:
        setHandState("pushed");
        break;
      default:
        setHandState(totalPlayerCount > totalHouseCount ? "won" : "lost");
    }
  }, [
    handEnded,
    isPlayerBusted,
    isHouseBusted,
    setHandState,
    totalPlayerCount,
    totalHouseCount,
  ]);

  return (
    <div className="flex flex-col items-center justify-center gap-5 m-0">
      <div className="flex flex-row gap-10 w-full">
        {isActive && <p>{"=>"}</p>}
        <p>
          {cards.map((card, index) => {
            const isLast = index === cards.length - 1;
            if (!isLast) {
              return card + ", ";
            }
            return card;
          })}
          (Total count: {totalPlayerCount})
        </p>
      </div>
      {!!handState && (
        <p>{handState.charAt(0).toUpperCase() + handState.slice(1)}</p>
      )}
      {isPlayerBusted && <p className="text-red-500">busted</p>}
    </div>
  );
};
