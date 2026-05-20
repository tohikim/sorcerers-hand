import { useEffect, useState, type MouseEvent } from "react";
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

function App() {
  const [deck, setDeck] = useState<string[]>([]);
  const [houseCards, setHouseCards] = useState<string[]>([]);
  const [playerCards, setPlayerCards] = useState<string[][]>([[]]);
  const [activeHandIndex, setActiveHandIndex] = useState(0);
  const [playerTurnEnded, setPlayerTurnEnded] = useState(false);
  const [canSplit, setCanSplit] = useState(false);
  const [handEnded, setHandEnded] = useState(false);

  const totalHouseCount = getCardsCount(houseCards);
  const isHouseBusted = totalHouseCount > BUSTING_THRESHOLD;
  const houseTurnEnded = totalHouseCount >= HOUSE_DRAWING_THRESHOLD;

  const drawPlayerCard = (handIndex = activeHandIndex) => {
    const topCard = deck[0];

    setPlayerCards((prev) => {
      const targetHand = [...prev[handIndex], topCard];

      const prefixState = prev.slice(0, handIndex);
      const suffixState = prev.slice(handIndex + 1, prev.length);

      return [...prefixState, targetHand, ...suffixState];
    });

    setDeck((prev) => prev.slice(1));
  };

  const handleStartGame = async (e: MouseEvent) => {
    e.preventDefault();

    await sleep(1000);
    const firstCard = deck[0];
    const secondCard = deck[1];
    const thirdCard = deck[2];
    setPlayerCards([[firstCard, thirdCard]]);
    setHouseCards([secondCard]);

    setDeck((prev) => prev.slice(3));
  };

  const handleReplay = (e: MouseEvent) => {
    e.preventDefault();

    setHouseCards([]);
    setPlayerCards([[]]);
    setActiveHandIndex(0);
    setPlayerTurnEnded(false);
    setHandEnded(false);

    handleStartGame(e);
  };

  const handleHitAction = (e: MouseEvent) => {
    e.preventDefault();

    drawPlayerCard();
  };

  const handleSplitAction = (e: MouseEvent) => {
    e.preventDefault();

    const topCard = deck[0];

    setPlayerCards((prev) => {
      const targetHand = prev[activeHandIndex];
      const clonedTartgetHand = cloneDeep(targetHand);

      const prefixState = prev.slice(0, activeHandIndex);
      const suffixState = prev.slice(activeHandIndex + 1, prev.length);

      const splitCard = clonedTartgetHand.pop();
      const newHand = [splitCard, topCard];

      return [...prefixState, clonedTartgetHand, newHand, ...suffixState];
    });

    setActiveHandIndex((prev) => prev + 1);

    setDeck((prev) => prev.slice(1));
  };

  const handleHandEnded = async () => {
    const upcomingIndex = activeHandIndex - 1;

    if (upcomingIndex >= 0 && playerCards[upcomingIndex].length === 1) {
      const topCard = deck[0];

      setPlayerCards((prev) => {
        const targetHand = [...(prev[upcomingIndex] || []), topCard];

        const prefixState = prev.slice(0, upcomingIndex);
        const suffixState = prev.slice(upcomingIndex + 1, prev.length);

        return [...prefixState, targetHand, ...suffixState];
      });

      setDeck((prev) => prev.slice(1));
    }

    setActiveHandIndex(upcomingIndex);
  };

  useEffect(() => {
    const orderedDeck = getDeck();
    setDeck(shuffle(orderedDeck));
  }, []);

  useEffect(() => {
    if (deck.length < SHOE_SHUFFLING_THRESHOLD && houseTurnEnded) {
      const newDeck = getDeck();
      setDeck(shuffle(newDeck));
    }
  }, [deck, houseTurnEnded]);

  useEffect(() => {
    if (playerTurnEnded || !playerCards.length) {
      setCanSplit(false);

      return;
    }

    const firstCardValue =
      figureValues[playerCards?.[activeHandIndex]?.[0]?.[0] as Figures];
    const secondCardValue =
      figureValues[playerCards?.[activeHandIndex]?.[1]?.[0] as Figures];

    setCanSplit(
      firstCardValue !== undefined &&
        firstCardValue === secondCardValue &&
        playerCards[activeHandIndex].length === 2,
    );
  }, [playerCards, activeHandIndex]);

  useEffect(() => {
    const allPlayerHandsAreBusted = playerCards.every(
      (playerHand) => getCardsCount(playerHand) > BUSTING_THRESHOLD,
    );

    if (!!playerCards.length && allPlayerHandsAreBusted) {
      setHandEnded(true);

      return;
    }

    const activeHand = playerCards[activeHandIndex];

    if (
      activeHandIndex >= 0 &&
      activeHand &&
      getCardsCount(activeHand) > BUSTING_THRESHOLD
    ) {
      handleHandEnded();
    }
  }, [playerCards, activeHandIndex]);

  useEffect(() => {
    if (activeHandIndex >= 0) {
      return;
    }

    (async () => {
      const newDeck = cloneDeep(deck);
      let internalHouseCards = cloneDeep(houseCards);

      do {
        const topCard = newDeck[0];

        internalHouseCards = [...internalHouseCards, topCard];
        setHouseCards((prev) => [...prev, topCard]);

        newDeck.shift();

        await sleep(1000);
      } while (getCardsCount(internalHouseCards) < HOUSE_DRAWING_THRESHOLD);

      setHandEnded(true);
      setDeck(newDeck);
    })();
  }, [activeHandIndex]);

  return (
    <div className="flex flex-col items-center justify-center text-4xl gap-10 p-10">
      {!houseCards.length ? (
        <button
          onClick={handleStartGame}
          className="border border-black rounded-2xl p-2"
        >
          Start the game
        </button>
      ) : (
        <div className="flex flex-col items-center justify-center text-4xl gap-10 p-10">
          <p>
            House cards:{" "}
            {houseCards.map((card, index) => {
              const isLast = index === houseCards.length - 1;
              if (!isLast) {
                return card + ", ";
              }
              return card;
            })}
            (Total count: {totalHouseCount})
          </p>
          {isHouseBusted && <p>House busted</p>}
          <p className="m-0">Player cards: </p>
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
                  handEnded={handEnded}
                />
              </div>
            );
          })}
          {!playerTurnEnded && !handEnded && (
            <div className="flex flex-row gap-10">
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
          {handEnded && (
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
