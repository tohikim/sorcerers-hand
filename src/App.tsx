import { useEffect, useState, type MouseEvent } from "react";
import { getDeck } from "./utils/get-deck";
import { shuffle } from "./utils/shuffle-deck";
import { getCardsCount } from "./utils/get-cards-count";
import {
  BUSTING_THRESHOLD,
  figureValues,
  HOUSE_DRAWING_THRESHOLD,
  SHOE_SHUFFLING_THRESHOLD,
} from "./constants/cards";
import { sleep } from "./utils/sleep";
import { cloneDeep } from "lodash";
import type { Figures } from "./types/figures";
import type { GameState } from "./types/game-state";

function App() {
  const [deck, setDeck] = useState<string[]>([]);
  const [playerCards, setPlayerCards] = useState<string[]>([]);
  const [houseCards, setHouseCards] = useState<string[]>([]);
  const [playerTurnEnded, setPlayerTurnEnded] = useState(false);
  const [gameState, setGameState] = useState<GameState>();
  const [canSplit, setCanSplit] = useState(false);

  const totalPlayerCount = getCardsCount(playerCards);
  const totalHouseCount = getCardsCount(houseCards);

  const isPlayerBusted = totalPlayerCount > BUSTING_THRESHOLD;
  const isHouseBusted = totalHouseCount > BUSTING_THRESHOLD;
  const houseTurnEnded = totalHouseCount >= HOUSE_DRAWING_THRESHOLD;

  const handleStartGame = (e: MouseEvent) => {
    e.preventDefault();
    const firstCard = deck[0];
    const secondCard = deck[1];
    const thirdCard = deck[2];

    setPlayerCards([firstCard, thirdCard]);
    setHouseCards([secondCard]);

    setDeck((prev) => {
      const newDeck = prev.slice(3);

      return newDeck;
    });
  };

  const handleHitAction = (e: MouseEvent) => {
    e.preventDefault();
    const topCard = deck[0];

    setPlayerCards((prev) => [...prev, topCard]);

    setDeck((prev) => {
      const newDeck = prev.slice(1);

      return newDeck;
    });
  };

  const handleStandAction = async (e: MouseEvent) => {
    e.preventDefault();
    setPlayerTurnEnded(true);
    const newDeck = cloneDeep(deck);
    let internalHouseCount = totalHouseCount;

    do {
      const topCard = newDeck[0];

      internalHouseCount += figureValues[topCard[0] as Figures];

      setHouseCards((prev) => [...prev, topCard]);

      newDeck.shift();

      await sleep(1000);
    } while (internalHouseCount < HOUSE_DRAWING_THRESHOLD);

    setDeck(newDeck);
  };

  const handleSplitAction = (e: MouseEvent) => {
    e.preventDefault();
  };

  const handleReplay = (e: MouseEvent) => {
    e.preventDefault();

    setPlayerCards([]);
    setHouseCards([]);
    setPlayerTurnEnded(false);
    setGameState(undefined);

    handleStartGame(e);
  };

  useEffect(() => {
    const orderedDeck = getDeck();
    setDeck(shuffle(orderedDeck));
  }, []);

  useEffect(() => {
    const orderedDeck = getDeck();
    if (deck.length < SHOE_SHUFFLING_THRESHOLD) {
      setDeck(shuffle(orderedDeck));
    }
  }, [deck]);

  useEffect(() => {
    if (playerTurnEnded || !playerCards.length) {
      setCanSplit(false);

      return;
    }

    const firstCardValue = figureValues[playerCards[0][0] as Figures];
    const secondCardValue = figureValues[playerCards[1][0] as Figures];

    setCanSplit(firstCardValue === secondCardValue && playerCards.length === 2);
  }, [playerCards, playerTurnEnded]);

  useEffect(() => {
    if (isPlayerBusted) {
      setPlayerTurnEnded(true);
      setGameState("lost");
    }

    if (houseTurnEnded) {
      switch (true) {
        case isHouseBusted:
          setGameState("won");
          break;
        case totalPlayerCount === totalHouseCount:
          setGameState("pushed");
          break;
        default:
          setGameState(totalPlayerCount > totalHouseCount ? "won" : "lost");
      }
    }
  }, [houseTurnEnded, isPlayerBusted]);

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
          {isHouseBusted && <p>HOUSE IS BUSTED!</p>}
          <p>Player cards: </p>
          <div>
            <p>
              {playerCards.map((card, index) => {
                const isLast = index === playerCards.length - 1;
                if (!isLast) {
                  return card + ", ";
                }
                return card;
              })}
              (Total count: {totalPlayerCount})
            </p>
          </div>
          {isPlayerBusted && <p>PLAYER IS BUSTED!</p>}
          {!isPlayerBusted && !playerTurnEnded && (
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
                onClick={handleStandAction}
                className="border border-black rounded-2xl p-2"
              >
                Stand
              </button>
            </div>
          )}
          {gameState && (
            <div>
              <p>You {gameState}</p>
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
