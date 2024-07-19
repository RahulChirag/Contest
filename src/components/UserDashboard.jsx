import React, { useEffect, useState } from "react";
import Modal from "react-modal"; // Import react-modal
import { doc, getDoc, setDoc } from "firebase/firestore"; // Import Firestore functions
import data from "../jsonfiles/data.json";
import { db } from "../firebase"; // Ensure you have configured Firebase
import Game from "./Game";

// Set the app element for accessibility
Modal.setAppElement("#root");

const UserDashboard = ({
  timeLeft,
  theme,
  handleLogout,
  setTimeLeft,
  lastDayToPlayGame,
  userData,
  noOfLevels,
  levelsEnabled,
  levelsCompleted,
  levelsDisabled,
  levelsData,
  setLevels,
}) => {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [numberOfQuestions, setNumberOfQuestions] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [incompleteQuestionIds, setIncompleteQuestionIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [allQuestionsIncomplete, setAllQuestionsIncomplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    if (selectedLevel && questions.length > 0 && levelsData) {
      const allIncomplete = questions.every((question) => {
        const questionStatus = levelsData[
          selectedLevel.id
        ]?.questionStatus?.find((qs) => qs.id === question.id);
        return questionStatus ? !questionStatus.completed : true;
      });

      setAllQuestionsIncomplete(allIncomplete);
    }
  }, [questions, levelsData, selectedLevel]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastDayToPlayGame) {
        const now = new Date();
        const lastDay = new Date(lastDayToPlayGame);
        const timeDiff = lastDay - now;

        if (timeDiff <= 0) {
          setTimeLeft("Time UP");
          clearInterval(interval);
        } else {
          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((timeDiff / (1000 / 60)) % 60);
          const seconds = Math.floor((timeDiff / 1000) % 60);

          setTimeLeft(
            `${String(days).padStart(2, "0")}:${String(hours).padStart(
              2,
              "0"
            )}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
              2,
              "0"
            )}`
          );
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastDayToPlayGame, setTimeLeft]);

  useEffect(() => {
    if (noOfLevels) {
      const themeData = data.find((d) => d.Theme === theme);
      if (themeData) {
        const initialLevel = themeData.Content.Levels.find(
          (level) => level.id === 0
        );
        setSelectedLevel(initialLevel);
        fetchLevelData(initialLevel?.GamePath, initialLevel.id);
      }
    }
  }, [theme, noOfLevels]);

  useEffect(() => {
    if (levelsData && selectedLevel) {
      if (questions.length > 0 && levelsData[selectedLevel.id]) {
        const incompleteIds = questions
          .filter((question) => {
            const questionStatus = levelsData[
              selectedLevel.id
            ]?.questionStatus?.find((qs) => qs.id === question.id);
            return questionStatus && !questionStatus.completed;
          })
          .map((question) => question.id);

        setIncompleteQuestionIds(incompleteIds);
        console.log("Incomplete Question IDs:", incompleteIds);
      }
    }
  }, [questions, levelsData, selectedLevel]);

  const fetchLevelData = async (gamePath, levelId) => {
    setIsLoading(true); // Start loading
    try {
      const response = await fetch(gamePath);
      const levelData = await response.json();
      const numQuestions = levelData.questions.length;
      setGameData(levelData.questions);
      const questionStatus = levelData.questions.map((question) => ({
        id: question.id,
        completed: false, // Initialize all questions as incomplete
      }));
      setQuestions(levelData.questions);
      setNumberOfQuestions(numQuestions);
      updateUserDoc(levelId, numQuestions, questionStatus);
    } catch (error) {
      console.error("Failed to fetch level data:", error);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const handleLevelClick = (levelId) => {
    const themeData = data.find((d) => d.Theme === theme);
    if (themeData) {
      const levelData = themeData.Content.Levels.find(
        (level) => level.id === levelId
      );
      setSelectedLevel(levelData);
      fetchLevelData(levelData.GamePath, levelId);
    }
  };

  const updateUserDoc = async (levelId, numQuestions, questionStatus) => {
    setLevels(levelsData);
    try {
      const userDocRef = doc(
        db,
        "Contest-leaderboard",
        `${userData.email}--${userData.username}`
      );
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().levels?.[levelId]) {
        return;
      }

      await setDoc(
        userDocRef,
        {
          levels: {
            [levelId]: {
              numberOfQuestions: numQuestions,
              questionStatus: questionStatus,
            },
          },
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error updating user document:", error);
    }
  };

  const getLevels = () => {
    const levels = Array.from({ length: noOfLevels }, (_, i) => ({
      level: i + 1,
      status: "disabled",
    }));

    levelsEnabled.forEach((index) => {
      levels[index].status = "enabled";
    });

    levelsCompleted.forEach((index) => {
      levels[index].status = "completed";
    });

    levelsDisabled.forEach((index) => {
      levels[index].status = "disabled";
    });

    return levels;
  };

  const levels = getLevels();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col">
      <header className="w-full px-3 py-4 bg-slate-400 flex items-center justify-between ">
        <div className="h-full">
          <img
            src="/assets/Logo.png"
            alt=""
            className="h-full object-contain"
          />
        </div>
        <div className="h-full text-center flex items-center justify-center">
          <button onClick={handleLogout} className="">
            Logout
          </button>
        </div>
      </header>

      {timeLeft === "Time UP" ? (
        <section className="flex-grow">Time UP</section>
      ) : (
        <section className="flex-grow flex flex-col lg:flex-row">
          <div className="h-16 w-full bg-slate-600 lg:w-1/6 lg:h-full">
            <div className="flex lg:flex-col items-center">
              {levels.map((level) => (
                <button
                  key={level.level}
                  onClick={() => handleLevelClick(level.level - 1)}
                  className={`mb-2 p-2 rounded text-white ${
                    level.status === "enabled"
                      ? "bg-green-500"
                      : level.status === "completed"
                      ? "bg-blue-500"
                      : "bg-red-500"
                  }`}
                  disabled={level.status === "disabled"}
                >
                  Level {level.level}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-grow p-4">
            <div className="">
              <span>{theme}</span>
              <span>User: {userData.username}</span>
            </div>
            <div className="md:text-xl lg:text-3xl">
              <span className="font-semibold">Time Left:</span>
              <span className="font-bold">{timeLeft}</span>
            </div>

            {levelsData ? (
              selectedLevel && (
                <div className="mt-4 p-4">
                  <h2 className="text-2xl mb-4">{selectedLevel.Level}</h2>

                  <p>Game Type: {selectedLevel.GameType}</p>
                  {questions.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-xl mb-4">Questions</h3>
                      <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {questions.map((question, index) => {
                          const questionStatus = levelsData[
                            selectedLevel?.id
                          ]?.questionStatus?.find(
                            (qs) => qs.id === question.id
                          );
                          const isCompleted = questionStatus
                            ? questionStatus.completed
                            : false;
                          return (
                            <div
                              key={question.id}
                              className={`mb-2 p-2 rounded ${
                                isCompleted ? "bg-green-300" : "bg-white"
                              }`}
                            >
                              <p className="font-bold">
                                Q{index + 1}: {question.question}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <button
                    className="mt-4 bg-green-300 p-2"
                    onClick={() => setIsModalOpen(true)}
                  >
                    {allQuestionsIncomplete ? (
                      <span>Start Game</span>
                    ) : (
                      <span>Resume Game</span>
                    )}
                  </button>
                </div>
              )
            ) : (
              <span>Loading...</span>
            )}
          </div>
          <Modal
            isOpen={isModalOpen}
            onRequestClose={() => setIsModalOpen(false)}
            className="inset-0 bg-white relative h-full"
          >
            <Game
              gameType={selectedLevel.GameType}
              questionIndex={incompleteQuestionIds[0] - 1}
              onclick={() => setIsModalOpen(false)}
              gameData={gameData}
            />
          </Modal>
        </section>
      )}
    </div>
  );
};

export default UserDashboard;
