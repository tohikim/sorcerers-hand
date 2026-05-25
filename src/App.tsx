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
// import type { ChipValue } from "./types/chip-values";
import { chipDenominations, PLAYER_BANKROLL } from "./constants/chips";

interface PlayerHand {
  cards: string[];
  betValues: number[];
}

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [dealMade, setDealMade] = useState(false);
  const [deck, setDeck] = useState<string[]>([]);
  const [houseCards, setHouseCards] = useState<string[]>([]);
  const [playerCards, setPlayerCards] = useState<PlayerHand[]>([]);
  const [activeHandIndex, setActiveHandIndex] = useState(0);
  const [playerTurnEnded, setPlayerTurnEnded] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [bankTotal, setBankTotal] = useState(PLAYER_BANKROLL);
  const [betValues, setBetValues] = useState<number[]>([]);
  const [previousBetValues, setPreviousBetValues] = useState<number[]>([]);
  // prevWonBankTotal useRef

  const betTotal = betValues.reduce((acc, cur) => acc + cur, 0);
  // const hasCredits = bankTotal > 0 || betTotal >= 0;

  const totalHouseCount = getCardsCount(houseCards);
  const isHouseBusted = totalHouseCount > BUSTING_THRESHOLD;
  const gameSetupDone =
    playerCards[activeHandIndex >= 0 ? activeHandIndex : 0].length >= 2;

  const canSplit = useMemo(() => {
    const hasExactlyTwoCards = playerCards?.[activeHandIndex]?.length === 2;
    const firstCardValue =
      figureValues[playerCards?.[activeHandIndex]?.[0]?.[0] as Figures];
    const secondCardValue =
      figureValues[playerCards?.[activeHandIndex]?.[1]?.[0] as Figures];

    return (
      hasExactlyTwoCards &&
      !playerTurnEnded &&
      firstCardValue !== undefined &&
      firstCardValue === secondCardValue
    );
  }, [playerTurnEnded, playerCards, activeHandIndex]);

  // const chipOneCount = ((bankTotal / 1) as ChipValue) || 0;
  // const chipFiveCount = ((bankTotal / 5) as ChipValue) || 0;
  // const chipTenCount = ((bankTotal / 10) as ChipValue) || 0;
  // const chipFiftyCount = ((bankTotal / 50) as ChipValue) || 0;
  // const chipHundredCount = ((bankTotal / 100) as ChipValue) || 0;
  // const chips = [
  //   chipOneCount,
  //   chipFiveCount,
  //   chipTenCount,
  //   chipFiftyCount,
  //   chipHundredCount,
  // ];

  const drawPlayerCard = (card: string, handIndex = activeHandIndex) => {
    setPlayerCards((prev) => {
      const targetHand = [...(prev[handIndex] || []), card];

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
    setPlayerCards([[]]);
    setDealMade(false);
    setBetValues([]);
  };

  const undoLatestBetChip = (e: MouseEvent) => {
    e.preventDefault();
    if (dealMade) return;

    const poppedValue = betValues.pop();
    setBankTotal((prev) => prev + poppedValue);
  };

  const handleDeal = async (e: MouseEvent) => {
    e.preventDefault();
    setDealMade(true);

    setPreviousBetValues(cloneDeep(betValues));

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

    setBetValues((prev) => {
      const newBet = [...prev, ...newChips];
      return newBet.toSorted((a, b) => b - a);
    });
    setBankTotal(remainingFunds);
  };

  console.log(betValues);
  const handleRedoLastBet = (e: MouseEvent) => {
    e.preventDefault();

    setBetValues(previousBetValues);
    // remove previous bet from current bankroll
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
      const prefixState = prev.slice(0, activeHandIndex);
      const suffixState = prev.slice(activeHandIndex + 1, prev.length);

      const targetHand = cloneDeep(prev[activeHandIndex]);

      const split = targetHand.pop();

      const newHand = [split, topCard];

      return [...prefixState, targetHand, newHand, ...suffixState];
    });

    setActiveHandIndex((prev) => prev + 1);

    setDeck((prev) => prev.slice(1));
  };

  const handleHandEnded = async () => {
    const upcomingIndex = activeHandIndex - 1;

    if (upcomingIndex >= 0 && playerCards[upcomingIndex].length === 1) {
      drawPlayerCard(deck[0], upcomingIndex);

      setDeck((prev) => prev.slice(1));
    }

    setActiveHandIndex(upcomingIndex);
  };

  useEffect(() => {
    const allPlayerHandsAreBusted = playerCards.every(
      (playerHand) => getCardsCount(playerHand) > BUSTING_THRESHOLD,
    );

    if (!!playerCards.length && allPlayerHandsAreBusted) {
      setGameEnded(true);

      return;
    }

    const activeHand = playerCards[activeHandIndex];

    if (
      activeHandIndex >= 0 &&
      activeHand &&
      getCardsCount(activeHand) >= BUSTING_THRESHOLD
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
    <div className="flex flex-col items-center justify-center text-4xl gap-10 p-10">
      {!gameStarted ? (
        <button
          onClick={(e) => {
            e.preventDefault();
            setGameStarted(true);
          }}
          className="border border-black rounded-2xl p-2"
        >
          Start the game
        </button>
      ) : (
        <div className="flex flex-col items-center justify-center text-4xl gap-10 p-10">
          {dealMade && (
            <div className="flex flex-col items-center justify-center">
              <p>House cards:</p>
              <p>
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
              <p className="m-0 pt-16">Player cards: </p>
              {playerCards.map((cards, index) => {
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center text-4xl gap-10"
                  >
                    <PlayerHand
                      key={index}
                      cards={cards}
                      totalHouseCount={totalHouseCount}
                      isActive={index === activeHandIndex}
                      gameEnded={gameEnded}
                      showActiveIndicator={playerCards.length > 1}
                    />
                  </div>
                );
              })}
              {!playerTurnEnded && !gameEnded && gameSetupDone && (
                <div className="flex flex-row gap-10 pt-12">
                  <button
                    onClick={handleHitAction}
                    className="border border-black rounded-2xl p-2"
                  >
                    Hit
                  </button>
                  {canSplit && (
                    <button
                      onClick={handleSplitAction}
                      className="border border-black rounded-2xl p-2"
                    >
                      Split
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleHandEnded();
                    }}
                    className="border border-black rounded-2xl p-2"
                  >
                    Stand
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col justify-center items-center gap-10">
            <p>Bet Total: {betTotal}</p>
            {!!betValues[0] && (
              <div className="flex flex-row gap-10 justify-center items-center">
                <button
                  className="rounded-[50%] border border-black p-2 w-25 h-25 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
                  onClick={undoLatestBetChip}
                >
                  {betValues[betValues.length - 1]}
                </button>
                {!dealMade && (
                  <button
                    className="border border-black rounded-2xl p-2 h-fit"
                    onClick={handleDeal}
                  >
                    Deal
                  </button>
                )}
              </div>
            )}
            {!dealMade && (
              <div className="flex flex-col items-center justify-center gap-5">
                <p>Bank Total: ${bankTotal}</p>
                {bankTotal > 0 ? (
                  <div className="flex flex-col items-center justify-center gap-5">
                    <div className="flex flex-row gap-4">
                      {chipDenominations.map((chip, index) => {
                        if (chip < bankTotal) {
                          return (
                            <div key={index}>
                              <button
                                onClick={(e: MouseEvent) => {
                                  e.preventDefault();
                                  setBankTotal((prev) => prev - chip);
                                  setBetValues((prev) => {
                                    const newBet = [...prev, chip];
                                    return newBet.toSorted((a, b) => b - a);
                                  });
                                }}
                                className="border border-black rounded-[50%] h-25 w-25 p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(0,0,0,0.8)]"
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
                      <button
                        className="border border-black rounded-2xl p-2"
                        onClick={handleAllIn}
                      >
                        ALL IN
                      </button>
                      {!!previousBetValues.length && !betValues.length && (
                        <button
                          className="border border-black rounded-2xl p-2"
                          onClick={handleRedoLastBet}
                        >
                          Redo last bet
                        </button>
                      )}
                      {!!betValues[0] && (
                        <button
                          className="border border-black rounded-2xl p-2"
                          onClick={(e: MouseEvent) => {
                            e.preventDefault();
                            setBetValues([]);
                            setBankTotal(PLAYER_BANKROLL);
                            //need to update with prevWonBankTotal AFTER win/lose logic
                            //after this action, it should still show the 'replay last bet'
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    className="border border-black rounded-2xl p-2"
                    onClick={(e: MouseEvent) => {
                      e.preventDefault();
                      setBetValues([]);
                      setBankTotal(PLAYER_BANKROLL);
                      //need to update with prevWonBankTotal AFTER win/lose logic
                    }}
                  >
                    Reset the bet
                  </button>
                )}
              </div>
            )}
          </div>
          {gameEnded && (
            <div>
              <button
                className="border border-black rounded-2xl p-2"
                onClick={handleReplay}
              >
                Play again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
