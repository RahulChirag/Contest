// Game.jsx
import React from "react";
import McqGame from "./McqGame";
import FibGame from "./FibGame";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const Game = ({
  gameType,
  questionIndex,
  onclick,
  gameData,
  userData,
  duration,
  updateQuestionStatus,
  levelsCompleted,
  levelsDisabled,
  levelsEnabled,
  selectedLevelId,
}) => {
  const handleUnlockNextLevel = async () => {
    console.log("nextLevelUnlocked");
    const nextLevelId = selectedLevelId + 1;
    const updatedLevelsCompleted = [...levelsCompleted, selectedLevelId];
    const updatedLevelsDisabled = levelsDisabled.filter(
      (id) => id !== nextLevelId
    );
    const updatedLevelsEnabled = [...levelsEnabled, nextLevelId];

    const userDocRef = doc(
      db,
      "Contest-leaderboard",
      `${userData.email}--${userData.username}`
    );

    await updateDoc(userDocRef, {
      levelsCompleted: updatedLevelsCompleted,
      levelsDisabled: updatedLevelsDisabled,
      levelsEnabled: updatedLevelsEnabled,
    });
  };

  const renderGame = () => {
    switch (gameType) {
      case "MCQ":
        return (
          <McqGame
            currentQuestion={gameData[questionIndex]}
            onclick={onclick}
            userData={userData}
            duration={duration}
            updateQuestionStatus={updateQuestionStatus}
            handleUnlockNextLevel={handleUnlockNextLevel}
            levelsCompleted={levelsCompleted} // Pass levelsCompleted
            Index={questionIndex}
            gameData={gameData}
          />
        );
      case "Fill in the Blanks":
        return (
          <FibGame
            currentQuestion={gameData[questionIndex]}
            onclick={onclick}
            userData={userData}
            duration={duration}
            updateQuestionStatus={updateQuestionStatus}
            handleUnlockNextLevel={handleUnlockNextLevel}
            levelsCompleted={levelsCompleted} // Pass levelsCompleted
            Index={questionIndex}
            gameData={gameData}
          />
        );
      default:
        return <p>Unknown Game Type</p>;
    }
  };

  return <>{renderGame()}</>;
};

export default Game;
