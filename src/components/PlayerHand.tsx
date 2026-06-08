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
    <div>
      <div className="flex flex-col items-center justify-start gap-5">
        <div className="min-w-30 inline-flex items-center justify-start bg-zinc-950/80 px-5 border border-[#d4af37]/40 rounded-4xl shadow-xl backdrop-blur-xl">
          {isActive && (
            <span className="text-emerald-300 text-[1rem] p-0 pr-2 self-center">
              ●
            </span>
          )}
          <span className="text-[14px] font-sans tracking-widest text-zinc-400  text-start pr-5">
            {totalPlayerCount}
          </span>
          <div className="h-6 border-[0.7px] border-[#d4af37]/40 mr-5"></div>
          <span className="text-[1rem] text-yellow-400 text-end">
            ${betTotal}
          </span>
        </div>
        <div className="min-h-35">
          <div className="w-10 h-17 sm:w-14 sm:h-21 md:w-16 md:h-23 lg:w-18 lg:h-25 relative select-none">
            {cards.map((card, index) => {
              const topOffset = 13;
              const leftOffset = 15;
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
        <div className="flex flex-col gap-4 justify-center items-center pt-0">
          {!!betValues.length && (
            <>
              <button
                className={
                  latestChip === 500
                    ? "text-[1.4rem] border-3 border-dashed bg-indigo-900 hover:bg-indigo-800 border-indigo-300 text-indigo-100 font-bold rounded-[50%] h-20 w-20 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                    : latestChip === 100
                    ? "text-[1.4rem] border-3 border-dashed bg-zinc-900 hover:bg-zinc-800 border-zinc-400 text-zinc-100 font-bold rounded-[50%] h-20 w-20 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                    : latestChip === 25
                    ? "text-[1.4rem] border-3 border-dashed bg-emerald-800 hover:bg-emerald-700 border-emerald-300 text-emerald-100 font-bold rounded-[50%] h-20 w-20 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                    : latestChip === 5
                    ? "text-[1.4rem] border-3 border-dashed bg-rose-700 hover:bg-rose-600 border-rose-300 text-rose-100 font-bold rounded-[50%] h-20 w-20 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                    : "text-[1.4rem] border-3 border-dashed bg-stone-100 hover:bg-stone-200 border-stone-400 text-stone-800 font-bold rounded-[50%] h-20 w-20 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                }
              >
                {latestChip}
              </button>
            </>
          )}
          {!!handState && (
            <div className="flex flex-row items-center justify-center">
              <p className="m-0 p-0 text-[1rem]">
                You {handState.toLowerCase()}!
              </p>
              <p
                className={
                  handState === "Won"
                    ? "m-0 p-0 pl-2 font-sans text-[1rem] text-emerald-300"
                    : handState === "Lost" || handState === "Busted"
                    ? "m-0 p-0 pl-2 font-sans text-[1rem] text-red-500"
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
        </div>
      </div>
    </div>
  );
};
