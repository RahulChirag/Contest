import React from "react";
import McqGame from "./McqGame";
const Game = ({ gameType, questionIndex, onclick, gameData }) => {
  const renderGame = () => {
    switch (gameType) {
      case "MCQ":
        return (
          <McqGame
            currentQuestion={gameData[questionIndex]}
            onclick={onclick}
          />
        );
      default:
        return <p>Unknown Game Type</p>;
    }
  };

  return <>{renderGame()}</>;
};

export default Game;
