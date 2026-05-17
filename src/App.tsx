import { useEffect, useState, type MouseEvent } from "react";
import { getDeck } from "./utils/get-deck";
import { shuffle } from "./utils/shuffle-deck";
import { getCardsCount } from "./utils/get-cards-count";

function App() {
  const [deck, setDeck] = useState<string[]>([]);
  const [playerCards, setPlayerCards] = useState<string[]>([]);
  const [houseCards, setHouseCards] = useState<string[]>([]);

  const totalPlayerCount = getCardsCount(playerCards);
  const totalHouseCount = getCardsCount(houseCards);

  useEffect(() => {
    const orderedDeck = getDeck();
    setDeck(shuffle(orderedDeck));
  }, []);
  console.log(deck);

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
  };

  const handleStandAction = (e: MouseEvent) => {
    e.preventDefault();
  };

  console.log(playerCards, houseCards, deck);

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
          <p>
            Player cards:{" "}
            {playerCards.map((card, index) => {
              const isLast = index === playerCards.length - 1;
              if (!isLast) {
                return card + ", ";
              }
              return card;
            })}
            (Total count: {totalPlayerCount})
          </p>

          <button
            onClick={handleHitAction}
            className="border border-black rounded-2xl p-2"
          >
            Hit
          </button>

          <button
            onClick={handleStandAction}
            className="border border-black rounded-2xl p-2"
          >
            Stand
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
