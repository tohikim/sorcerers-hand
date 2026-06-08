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
  latestChip: number;
}

export const PlayerHand = ({
  cards,
  totalHouseCount,
  gameEnded,
  betValues,
  handleWin,
  houseHasBlackjack,
  latestChip,
  isActive,
}: PlayerHandProps) => {
  const [handState, setHandState] = useState<GameState>();
  const [wonBet, setWonBet] = useState<number>();

  const totalPlayerCount = getCardsCount(cards);
  const isPlayerBusted = totalPlayerCount > BUSTING_THRESHOLD;
  const betTotal = betValues.reduce((acc, cur) => acc + cur, 0);
  const isHouseBusted = totalHouseCount > BUSTING_THRESHOLD;

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
    <div className="">
      <div className="flex flex-col items-center justify-center gap-5">
        {!!handState && (
          <div className="flex flex-row items-center justify-center">
            <p className="m-0 p-0 italic text-[2.5rem]">
              You {handState.toLowerCase()}!
            </p>
            <p
              className={
                handState === "Won"
                  ? "m-0 p-0 pl-5 font-sans text-[2rem] text-emerald-300"
                  : handState === "Lost" || handState === "Busted"
                  ? "m-0 p-0 pl-5 font-sans text-[2rem] text-red-500"
                  : undefined
              }
            >
              {handState === "Won"
                ? `+$${(wonBet || 0) + betTotal}`
                : (handState === "Lost" || handState === "Busted") &&
                  `-$${(wonBet || 0) + betTotal}`}
            </p>
          </div>
        )}
        <div className="min-h-70">
          <div className="w-24 h-36 sm:w-32 sm:h-48 md:w-36 md:h-52 lg:w-40 lg:h-56 relative select-none">
            {cards.map((card, index) => {
              const topOffset = 24;
              const leftOffset = 16;
              return (
                <div
                  className="w-full h-auto absolute transition-all duration-300"
                  style={{
                    top: `${topOffset * index}px`,
                    left: `${leftOffset * index}px`,
                    zIndex: index,
                  }}
                  key={card}
                >
                  <img
                    src={`/assets/SVG-cards-1.3/${card}.svg`}
                    alt={card}
                    className="w-full h-auto drop-shadow-md"
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-5 justify-center items-center pt-10">
          {!!betValues.length && (
            <>
              <div className="min-w-30 inline-flex items-center justify-between bg-zinc-950/80 px-10 border border-[#d4af37]/40 rounded-4xl shadow-xl backdrop-blur-xl">
                {isActive && (
                  <span className="text-emerald-300 text-[2rem] p-0 pr-5 self-center">
                    ●
                  </span>
                )}
                <span className="text-[28px] font-sans tracking-widest text-zinc-400  text-start pr-10">
                  {totalPlayerCount}
                </span>
                <div className="h-6 border border-[#d4af37]/40 mr-10"></div>
                <span className="text-[2rem] text-yellow-400 text-end">
                  ${betTotal}
                </span>
              </div>
              <button
                className={
                  latestChip === 500
                    ? "text-[4rem] border-12 border-dashed bg-indigo-900 hover:bg-indigo-800 border-indigo-300 text-indigo-100 font-bold rounded-[50%] h-45 w-45 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                    : latestChip === 100
                    ? "text-[4rem] border-12 border-dashed bg-zinc-900 hover:bg-zinc-800 border-zinc-400 text-zinc-100 font-bold rounded-[50%] h-45 w-45 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                    : latestChip === 25
                    ? "text-[4rem] border-12 border-dashed bg-emerald-800 hover:bg-emerald-700 border-emerald-300 text-emerald-100 font-bold rounded-[50%] h-45 w-45 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                    : latestChip === 5
                    ? "text-[4rem] border-12 border-dashed bg-rose-700 hover:bg-rose-600 border-rose-300 text-rose-100 font-bold rounded-[50%] h-45 w-45 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                    : "text-[4rem] border-12 border-dashed bg-stone-100 hover:bg-stone-200 border-stone-400 text-stone-800 font-bold rounded-[50%] h-45 w-45 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                }
              >
                {latestChip}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
