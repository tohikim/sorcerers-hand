import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { getDeck } from "./utils/get-deck";
import { shuffle } from "./utils/shuffle-deck";
import { getCardsCount } from "./utils/get-cards-count";
import { figureValues } from "./constants/cards";
import {
  BUSTING_THRESHOLD,
  HOUSE_DRAWING_THRESHOLD,
  SHOE_SHUFFLING_THRESHOLD,
} from "./constants/variables";
import { sleep } from "./utils/sleep";
import { cloneDeep } from "lodash";
import type { Figures } from "./types/figures";
import { PlayerHand } from "./components/PlayerHand";
import { chipDenominations, PLAYER_BANKROLL } from "./constants/chips";
import type { PlayerHandStructure } from "./types/player-hand";

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [dealMade, setDealMade] = useState(false);
  const [deck, setDeck] = useState<string[]>([]);
  const [houseCards, setHouseCards] = useState<string[]>([]);
  const [playerCards, setPlayerCards] = useState<PlayerHandStructure[]>([]);
  const [activeHandIndex, setActiveHandIndex] = useState(0);
  const [playerTurnEnded, setPlayerTurnEnded] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [bankTotal, setBankTotal] = useState(PLAYER_BANKROLL);
  const [initialBet, setInitialBet] = useState<number[]>([]);
  const [previousBet, setPreviousBet] = useState<number[]>([]);

  const currentBetTotal = playerCards?.[activeHandIndex]?.betValues.reduce(
    (acc, cur) => acc + cur,
    0,
  );
  const latestChip = initialBet[initialBet.length - 1];
  const hasCredits = bankTotal >= currentBetTotal;
  const totalHouseCount = getCardsCount(houseCards);
  const isHouseBusted = totalHouseCount > BUSTING_THRESHOLD;
  const gameSetupDone =
    playerCards[activeHandIndex >= 0 ? activeHandIndex : 0]?.cards.length >= 2;

  const canSplit = useMemo(() => {
    const hasExactlyTwoCards =
      playerCards?.[activeHandIndex]?.cards.length === 2;
    const firstCardValue =
      figureValues[playerCards?.[activeHandIndex]?.cards[0]?.[0] as Figures];
    const secondCardValue =
      figureValues[playerCards?.[activeHandIndex]?.cards[1]?.[0] as Figures];

    return (
      hasExactlyTwoCards &&
      !playerTurnEnded &&
      firstCardValue !== undefined &&
      firstCardValue === secondCardValue &&
      hasCredits
    );
  }, [playerTurnEnded, playerCards, activeHandIndex]);

  const handleWin = (bet) => {
    setBankTotal((prev) => (prev += bet));
  };

  const drawPlayerCard = (card: string, handIndex = activeHandIndex) => {
    setPlayerCards((prev) => {
      const targetHand = {
        ...prev[handIndex],
        cards: [...(prev[handIndex]?.cards || []), card],
      };

      const prefixState = prev.slice(0, handIndex);
      const suffixState = prev.slice(handIndex + 1, prev.length);

      return [...prefixState, targetHand, ...suffixState];
    });
  };

  const handleReplay = async (e: MouseEvent) => {
    e.preventDefault();

    setActiveHandIndex(0);
    setPlayerTurnEnded(false);
    setGameEnded(false);
    setHouseCards([]);
    setPlayerCards([]);
    setDealMade(false);
    setInitialBet([]);
  };

  const undoLatestBetChip = (e: MouseEvent) => {
    e.preventDefault();
    if (dealMade) return;

    const poppedValue = initialBet.pop();
    setBankTotal((prev) => prev + poppedValue);
  };

  const handleDeal = async (e: MouseEvent) => {
    e.preventDefault();
    setDealMade(true);

    setPreviousBet(cloneDeep(initialBet));
    setPlayerCards([
      {
        cards: [],
        betValues: initialBet,
      },
    ]);

    let clonedDeck = cloneDeep(deck);

    if (clonedDeck.length < SHOE_SHUFFLING_THRESHOLD) {
      const cleanDeck = getDeck();
      clonedDeck = shuffle(cleanDeck);
    }

    const firstCard = clonedDeck[0];
    const secondCard = clonedDeck[1];
    const thirdCard = clonedDeck[2];

    setDeck(clonedDeck.slice(3));

    await sleep(1000);
    drawPlayerCard(firstCard, 0);

    await sleep(1000);
    setHouseCards([secondCard]);

    await sleep(1000);
    drawPlayerCard(thirdCard, 0);
  };

  const handleAllIn = (e: MouseEvent) => {
    e.preventDefault();

    let remainingFunds = bankTotal;
    const newChips: number[] = [];

    for (const chip of chipDenominations) {
      const count = Math.trunc(remainingFunds / chip);

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          newChips.push(chip);
        }
        remainingFunds -= count * chip;
      }
    }

    setInitialBet((prev) => {
      const newBet = [...prev, ...newChips];
      return newBet.toSorted((a, b) => b - a);
    });
    setBankTotal(remainingFunds);
  };

  const handleRedoLastBet = (e: MouseEvent) => {
    e.preventDefault();

    setInitialBet(previousBet);
    // @todo  remove previous bet from current bankroll
  };

  const handleHitAction = (e: MouseEvent) => {
    e.preventDefault();

    drawPlayerCard(deck[0]);

    setDeck((prev) => prev.slice(1));
  };

  const handleSplitAction = (e: MouseEvent) => {
    e.preventDefault();

    const topCard = deck[0];

    setPlayerCards((prev) => {
      const clonedTargetHand = cloneDeep(prev[activeHandIndex]);

      const split = clonedTargetHand.cards.pop();

      const newHand: PlayerHandStructure = {
        cards: [split, topCard],
        betValues: clonedTargetHand.betValues,
      };

      const prefixState = prev.slice(0, activeHandIndex);
      const suffixState = prev.slice(activeHandIndex + 1, prev.length);

      return [...prefixState, clonedTargetHand, newHand, ...suffixState];
    });

    setBankTotal((prev) => prev - currentBetTotal);
    setActiveHandIndex((prev) => prev + 1);

    setDeck((prev) => prev.slice(1));
  };

  const handleHandEnded = async () => {
    const upcomingIndex = activeHandIndex - 1;

    if (upcomingIndex >= 0 && playerCards[upcomingIndex].cards.length === 1) {
      drawPlayerCard(deck[0], upcomingIndex);

      setDeck((prev) => prev.slice(1));
    }

    setActiveHandIndex(upcomingIndex);
  };

  useEffect(() => {
    const allPlayerHandsAreBusted = playerCards.every(
      (playerHand) => getCardsCount(playerHand.cards) > BUSTING_THRESHOLD,
    );

    if (!!playerCards.length && allPlayerHandsAreBusted) {
      setGameEnded(true);

      return;
    }

    const activeHand = playerCards[activeHandIndex];

    if (
      activeHandIndex >= 0 &&
      activeHand &&
      getCardsCount(activeHand.cards) >= BUSTING_THRESHOLD
    ) {
      handleHandEnded();
    }
  }, [playerCards, activeHandIndex]);

  useEffect(() => {
    if (activeHandIndex >= 0) {
      return;
    }

    (async () => {
      setPlayerTurnEnded(true);

      const newDeck = cloneDeep(deck);
      let internalHouseCards = cloneDeep(houseCards);

      do {
        const topCard = newDeck[0];

        internalHouseCards = [...internalHouseCards, topCard];
        setHouseCards((prev) => [...prev, topCard]);

        newDeck.shift();

        await sleep(1000);
      } while (getCardsCount(internalHouseCards) < HOUSE_DRAWING_THRESHOLD);

      setDeck(newDeck);
      setGameEnded(true);
    })();
  }, [activeHandIndex]);

  return (
    <div
      className="relative min-h-screen h-full w-full overflow-y-auto flex items-center justify-center p-4 md:p-8 select-none bg-[#0a2012]"
      style={{
        background:
          "radial-gradient(circle at center, #1b5e20 0%, #0c3816 40%, #051a0b 85%, #020a04 100%)",
      }}
    >
      <div className="w-full h-screen absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[16px_16px]" />
      <div className="flex flex-col items-center justify-center text-white text-[3rem] gap-10 p-10 w-full h-screen">
        {!gameStarted ? (
          <>
            <p>BLACK JACK ORIGINAL</p>
            <button
              onClick={(e) => {
                e.preventDefault();
                setGameStarted(true);
                setBankTotal(PLAYER_BANKROLL);
              }}
              className="min-w-50 rounded-[3rem] p-4 pl-8 pr-8 bg-linear-to-b from-amber-600 to-amber-900 hover:from-amber-500 hover:to-amber-800 border border-amber-600 text-white font-bold tracking-wider shadow-[0_4px_15px_rgba(245,158,11,0.2)] active:scale-95 transition-all cursor-pointer"
            >
              Start the game
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-10 p-10 h-screen">
            {dealMade && (
              <div className="flex flex-col h-screen justify-between w-full">
                <div className="flex flex-col items-center justify-center gap-5 h-40">
                  <p className="text-amber-400/80 text-[2rem] font-sans tracking-[0.2em] uppercase font-bold mb-1">
                    House
                  </p>
                  <p className="min-h-30">
                    {houseCards.map((card, index) => {
                      const isLast = index === houseCards.length - 1;
                      if (!isLast) {
                        return card + ", ";
                      }
                      return card;
                    })}
                    {!!totalHouseCount && ` (${totalHouseCount})`}
                  </p>
                  {isHouseBusted && <p>House busted</p>}
                </div>
                <div className="flex flex-col items-center justify-baseline gap-5 h-120">
                  <p className="text-amber-400/80 text-[2rem] font-sans tracking-[0.2em] uppercase font-bold mt-6 mb-1">
                    Player
                  </p>
                  <div className="flex flex-row gap-44">
                    {playerCards.map((hand, index) => {
                      return (
                        <div
                          key={index}
                          className="flex flex-col items-center justify-center gap-10 m-0 p-0"
                        >
                          <PlayerHand
                            key={index}
                            cards={hand.cards}
                            betValues={hand.betValues}
                            totalHouseCount={totalHouseCount}
                            isActive={index === activeHandIndex}
                            gameEnded={gameEnded}
                            showActiveIndicator={playerCards.length > 1}
                            handleWin={handleWin}
                            houseHasBlackjack={
                              houseCards.length === 2 &&
                              totalHouseCount === BUSTING_THRESHOLD
                            }
                            playerTurnEnded={playerTurnEnded}
                            gameSetupDone={gameSetupDone}
                            latestChip={latestChip}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-start gap-5 m-0 p-0 h-70 mt-30">
                  <>
                    <div className="inline-flex items-center gap-5 bg-zinc-950/80 border border-[#d4af37]/40 px-6 py-4 rounded-4xl shadow-xl backdrop-blur-xl my-4">
                      <span className="text-[2rem] font-sans tracking-widest uppercase font-bold text-zinc-400">
                        Bank Total
                      </span>
                      <span className="text-[2.5rem]  text-zinc-200 drop-shadow-xl">
                        ${bankTotal}
                      </span>
                    </div>
                  </>
                  {!playerTurnEnded && !gameEnded && gameSetupDone && (
                    <div className="flex flex-row gap-10 pt-1 m-0">
                      <button
                        onClick={handleHitAction}
                        className="min-w-50 rounded-[3rem] p-4 pl-8 pr-8 bg-linear-to-b from-amber-600 to-amber-900 hover:from-amber-500 hover:to-amber-800 border border-amber-600 text-white font-bold tracking-wider shadow-[0_4px_15px_rgba(245,158,11,0.2)] active:scale-95 transition-all cursor-pointer"
                      >
                        Hit
                      </button>
                      {canSplit && (
                        <button
                          onClick={handleSplitAction}
                          className="min-w-50 rounded-[3rem] p-4 pl-8 pr-8 bg-linear-to-b from-amber-600 to-amber-900 hover:from-amber-500 hover:to-amber-800 border border-amber-600 text-white font-bold tracking-wider shadow-[0_4px_15px_rgba(245,158,11,0.2)] active:scale-95 transition-all cursor-pointer"
                        >
                          Split
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleHandEnded();
                        }}
                        className="min-w-50 rounded-[3rem] p-4 pl-8 pr-8 bg-linear-to-b from-amber-600 to-amber-900 hover:from-amber-500 hover:to-amber-800 border border-amber-600 text-white font-bold tracking-wider shadow-[0_4px_15px_rgba(245,158,11,0.2)] active:scale-95 transition-all cursor-pointer"
                      >
                        Stand
                      </button>
                    </div>
                  )}
                  {gameEnded && bankTotal > 0 && (
                    <button
                      className="rounded-[3rem] p-4 pl-8 pr-8 bg-linear-to-b from-amber-700 to-amber-950 hover:from-amber-600 hover:to-amber-800 border border-amber-600 text-amber-100 font-semibold shadow-md "
                      onClick={handleReplay}
                    >
                      Play again
                    </button>
                  )}
                </div>
              </div>
            )}
            {gameEnded && bankTotal <= 0 && (
              <div className="p-0 m-0 flex flex-col justify-center items-center gap-5">
                <p className="italic">GAME OVER! You lost all the money.</p>
                <button
                  className="rounded-[3rem] p-4 pl-8 pr-8 bg-linear-to-b from-amber-700 to-amber-950 hover:from-amber-600 hover:to-amber-800 border border-amber-600 text-amber-100 font-semibold shadow-md "
                  onClick={(e: MouseEvent) => {
                    e.preventDefault();
                    setBankTotal(PLAYER_BANKROLL);
                    setGameStarted(false);
                    handleReplay(e);
                  }}
                >
                  Restart the game
                </button>
              </div>
            )}
            <div className="flex flex-col justify-center items-center gap-10">
              {!dealMade && (
                <div className="flex flex-col items-center justify-center gap-5">
                  <div className="p-8 m-8 flex flex-row justify-between items-center gap-10 w-full bg-zinc-900/90 rounded-[3rem] border-2 border-[#d4af37] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    <div className="flex flex-col">
                      <div className="w-fit inline-flex items-baseline gap-5 m-0 p-0 bg-zinc-600/50  px-6 py-4 rounded-4xl shadow-xl backdrop-blur-xl my-4">
                        <span className="text-[2rem] font-sans tracking-widest uppercase font-bold text-zinc-400">
                          Bet
                        </span>
                        <span className="text-[2.5rem] text-zinc-200">
                          ${initialBet.reduce((acc, cur) => acc + cur, 0)}
                        </span>
                      </div>
                      <div className="w-fits inline-flex items-center gap-5 bg-zinc-600/50  px-6 py-4 rounded-4xl shadow-xl backdrop-blur-xl my-4">
                        <span className="text-[2rem] font-sans tracking-widest uppercase font-bold text-zinc-400">
                          Bank Total
                        </span>
                        <span className="text-[2.5rem] text-zinc-200 drop-shadow-xl">
                          ${bankTotal}
                        </span>
                      </div>
                    </div>
                    {!!initialBet[0] && (
                      <div className="flex flex-row gap-10 justify-center items-center m-0">
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
                          onClick={undoLatestBetChip}
                        >
                          {latestChip}
                        </button>
                        {!dealMade && (
                          <button
                            className="rounded-[3rem] p-4 pl-8 pr-8 bg-linear-to-b from-amber-700 to-amber-950 hover:from-amber-600 hover:to-amber-800 border border-amber-600 text-amber-100 font-semibold shadow-md "
                            onClick={handleDeal}
                          >
                            Deal
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {bankTotal >= 0 && (
                    <div className="flex flex-col items-center justify-baseline gap-10">
                      <div className="flex flex-row gap-4">
                        {chipDenominations.map((chip, index) => {
                          if (chip < bankTotal) {
                            return (
                              <div key={index}>
                                <button
                                  onClick={(e: MouseEvent) => {
                                    e.preventDefault();
                                    setBankTotal((prev) => prev - chip);
                                    setInitialBet((prev) => {
                                      const newBet = [...prev, chip];
                                      return newBet.toSorted((a, b) => b - a);
                                    });
                                  }}
                                  className={
                                    chip === 500
                                      ? "text-[4rem] border-12 border-dashed bg-indigo-900 hover:bg-indigo-800 border-indigo-300 text-indigo-100 font-bold rounded-[50%] h-50 w-50 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                                      : chip === 100
                                      ? "text-[4rem] border-12 border-dashed bg-zinc-900 hover:bg-zinc-800 border-zinc-400 text-zinc-100 font-bold rounded-[50%] h-50 w-50 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                                      : chip === 25
                                      ? "text-[4rem] border-12 border-dashed bg-emerald-800 hover:bg-emerald-700 border-emerald-300 text-emerald-100 font-bold rounded-[50%] h-50 w-50 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                                      : chip === 5
                                      ? "text-[4rem] border-12 border-dashed bg-rose-700 hover:bg-rose-600 border-rose-300 text-rose-100 font-bold rounded-[50%] h-50 w-50 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                                      : "text-[4rem] border-12 border-dashed bg-stone-100 hover:bg-stone-200 border-stone-400 text-stone-800 font-bold rounded-[50%] h-50 w-50 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                                  }
                                >
                                  {chip}
                                </button>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                      <div className="flex flex-row gap-4">
                        {bankTotal > 0 && (
                          <div className="flex flex-row gap-4">
                            <button
                              className="border border-red-500 rounded-[3rem] p-4 pl-8 pr-8 bg-linear-to-b from-red-700 to-red-950 hover:from-red-600 hover:to-red-800 text-white font-bold tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.3)"
                              onClick={handleAllIn}
                            >
                              ALL IN
                            </button>
                            {!!previousBet.length && !initialBet.length && (
                              <button
                                className="bg-linear-to-b from-amber-700 to-amber-950 hover:from-amber-600 hover:to-amber-800 border border-amber-600 text-amber-100 font-semibold shadow-md rounded-[3rem] p-4 pl-8 pr-8"
                                onClick={handleRedoLastBet}
                              >
                                Redo last bet
                              </button>
                            )}
                          </div>
                        )}
                        {!!initialBet[0] && (
                          <button
                            className="rounded-[3rem] p-4 pl-8 pr-8 bg-linear-to-b from-zinc-700 to-zinc-950 hover:from-zinc-600 hover:to-zinc-800 border border-zinc-500 text-zinc-100 font-bold tracking-wider shadow-[0_4px_15px_rgba(0,0,0,0.4)] active:scale-95 transition-all cursor-pointer"
                            onClick={(e: MouseEvent) => {
                              e.preventDefault();
                              setInitialBet([]);
                              setBankTotal(PLAYER_BANKROLL);
                            }}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
