import { useEffect, useState } from "react";
import { BLACKJACK_PAYOUT, BUSTING_THRESHOLD } from "../constants/variables";
import { getCardsCount } from "../utils/get-cards-count";
import type { GameState } from "../types/game-state";

export interface PlayerHandProps {
  cards: string[];
  totalHouseCount: number;
  isActive: boolean;
  gameEnded: boolean;
  showActiveIndicator: boolean;
  betValues: number[];
  handleWin: (bet: number) => void;
  houseHasBlackjack: boolean;
  gameSetupDone: boolean;
  playerTurnEnded: boolean;
  latestChip: number;
}

export const PlayerHand = ({
  cards,
  totalHouseCount,
  isActive,
  gameEnded,
  showActiveIndicator,
  betValues,
  handleWin,
  houseHasBlackjack,
  gameSetupDone,
  playerTurnEnded,
  latestChip,
}: PlayerHandProps) => {
  const totalPlayerCount = getCardsCount(cards);
  const isPlayerBusted = totalPlayerCount > BUSTING_THRESHOLD;
  const betTotal = betValues.reduce((acc, cur) => acc + cur, 0);

  const isHouseBusted = totalHouseCount > BUSTING_THRESHOLD;

  const [handState, setHandState] = useState<GameState>();
  const [wonBet, setWonBet] = useState<number>();

  useEffect(() => {
    const playerHasBlackjack =
      cards.length === 2 && totalPlayerCount === BUSTING_THRESHOLD;

    switch (true) {
      case isPlayerBusted:
        setHandState("Busted");

        break;
      case !gameEnded:
        setHandState(undefined);

        break;
      case isHouseBusted ||
        totalPlayerCount > totalHouseCount ||
        (!houseHasBlackjack && playerHasBlackjack):
        setHandState("Won");
        if (playerHasBlackjack) {
          const blackJackPayout = betTotal * BLACKJACK_PAYOUT;
          setWonBet(blackJackPayout);
          handleWin(betTotal + blackJackPayout);
          break;
        }
        setWonBet(betTotal);
        handleWin(betTotal * 2);

        break;
      case totalPlayerCount < totalHouseCount ||
        (houseHasBlackjack && !playerHasBlackjack):
        setHandState("Lost");

        break;
      case totalPlayerCount === totalHouseCount:
        setHandState("Pushed");
        handleWin(betTotal);

        break;
      default:
        break;
    }
  }, [
    isPlayerBusted,
    gameEnded,
    isHouseBusted,
    setHandState,
    totalPlayerCount,
    totalHouseCount,
  ]);

  return (
    <div className="flex flex-col items-center justify-center ">
      <div className="flex flex-row gap-8 w-full justify-center items-center min-h-30">
        {showActiveIndicator && isActive && (
          <p className="text-emerald-300">●</p>
        )}
        <p>
          {cards.map((card, index) => {
            const isLast = index === cards.length - 1;
            if (!isLast) {
              return card + ", ";
            }
            return card;
          })}
          {!!totalPlayerCount && ` (${totalPlayerCount})`}
        </p>
      </div>
      <div className="flex flex-col gap-10 justify-center items-center">
        {!!betValues.length && (
          <>
            <div className="inline-flex items-center gap-5 bg-zinc-950/80 border border-[#d4af37]/40 px-6 py-4 rounded-4xl shadow-xl backdrop-blur-xl my-4">
              <span className="text-[2rem] font-sans tracking-widest uppercase font-bold text-zinc-400">
                Bet
              </span>
              <span className="text-[2.5rem] text-yellow-400">${betTotal}</span>
            </div>
            <button
              className={
                latestChip === 500
                  ? "text-[4rem] border-12 border-dashed bg-indigo-900 hover:bg-indigo-800 border-indigo-300 text-indigo-100 font-bold rounded-[50%] h-50 w-50 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                  : latestChip === 100
                  ? "text-[4rem] border-12 border-dashed bg-zinc-900 hover:bg-zinc-800 border-zinc-400 text-zinc-100 font-bold rounded-[50%] h-50 w-50 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                  : latestChip === 25
                  ? "text-[4rem] border-12 border-dashed bg-emerald-800 hover:bg-emerald-700 border-emerald-300 text-emerald-100 font-bold rounded-[50%] h-50 w-50 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                  : latestChip === 5
                  ? "text-[4rem] border-12 border-dashed bg-rose-700 hover:bg-rose-600 border-rose-300 text-rose-100 font-bold rounded-[50%] h-50 w-50 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                  : "text-[4rem] border-12 border-dashed bg-stone-100 hover:bg-stone-200 border-stone-400 text-stone-800 font-bold rounded-[50%] h-50 w-50 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
              }
            >
              {latestChip}
            </button>
          </>
        )}

        {!!handState && (
          <div className="flex flex-col items-center justify-center gap-2">
            <p className="m-0 p-0 italic">You {handState.toLowerCase()}!</p>
            <p
              className={
                handState === "Won"
                  ? "m-0 p-0 font-sans font-bold text-[2rem] text-emerald-300"
                  : handState === "Lost" &&
                    "m-0 p-0 font-sans font-bold text-[2rem] text-red-500"
              }
            >
              {handState === "Won"
                ? `+$${(wonBet || 0) + betTotal}`
                : handState === "Lost" && `-$${(wonBet || 0) + betTotal}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
