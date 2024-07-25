import React, { useState, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

import selectionSound from "../sounds/selection.mp3";

const McqGame = ({
  currentQuestion,
  onclick,
  duration,
  updateQuestionStatus,
  userData,
  handleUnlockNextLevel,
  levelsCompleted,
  Index,
  gameData,
}) => {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [timer, setTimer] = useState(duration);
  const [score, setScore] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setTimer(duration);
    setSelectedOptions([]);
  }, [duration, currentQuestion]);

  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      handleNextClick();
    }
    return () => clearInterval(timerRef.current);
  }, [timer]);

  useEffect(() => {
    if (!currentQuestion) {
      handleUnlockNextLevel();
    }
  }, [currentQuestion]);

  const { question, questionImage, options, optionImages, answer, id } =
    currentQuestion || {};

  const isMultiSelect = Array.isArray(answer) && answer.length > 1;

  const handleOptionClick = (option) => {
    const audio = new Audio(selectionSound);
    audio.play();
    setShowNext(true);
    let newSelectedOptions = [];
    if (isMultiSelect) {
      newSelectedOptions = selectedOptions.includes(option)
        ? selectedOptions.filter((opt) => opt !== option)
        : [...selectedOptions, option];
    } else {
      newSelectedOptions = [option];
    }
    setSelectedOptions(newSelectedOptions);
  };

  const handleNextClick = async () => {
    if (currentQuestion) {
      const isAnswerCorrect = isMultiSelect
        ? selectedOptions.length === answer.length &&
          selectedOptions.every((opt) => answer.includes(opt))
        : selectedOptions.length === 1 && answer.includes(selectedOptions[0]);

      const scoreToAdd = isAnswerCorrect ? Math.ceil(timer) : 0;
      setScore(scoreToAdd);
      if (scoreToAdd > 0) {
        await updateScore(scoreToAdd);
      }
      updateQuestionStatus(id, true, scoreToAdd, selectedOptions);
      setSelectedOptions([]);
      setTimer(duration);
    }
    setShowNext(false);
  };

  const updateScore = async (scoreToAdd) => {
    const userDocRef = doc(
      db,
      "Contest-leaderboard",
      `${userData.email}--${userData.username}`
    );
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const existingScore = userDoc.data().finalScore || 0;
      const updatedScore = existingScore + scoreToAdd;
      await updateDoc(userDocRef, { finalScore: updatedScore });
    }
  };

  if (!currentQuestion) {
    return (
      <div className="max-w-full mx-auto p-4 border rounded-lg shadow-lg h-screen flex flex-col">
        <div className="flex justify-between mb-4 items-center">
          <button
            onClick={onclick}
            className="bg-blue-500 text-white py-2 px-4 rounded"
          >
            Close Game
          </button>
        </div>
        Level Completed.
      </div>
    );
  } else {
    <div className="max-w-full mx-auto p-4 border rounded-lg shadow-lg h-screen flex flex-col">
      <div className="flex justify-between mb-4 items-center">
        <button
          onClick={onclick}
          className="bg-blue-500 text-white py-2 px-4 rounded"
        >
          Close Game
        </button>
      </div>
      No data Found.
    </div>;
  }

  const color = [
    "#ECA82C",
    "#0075C4",
    "#A0510F",
    "#2C9CA6",
    "#F06BE3",
    "#7965F4",
    "#ECA82C",
    "#0075C4",
    "#A0510F",
    "#2C9CA6",
    "#F06BE3",
    "#7965F4",
  ];

  const darkenColor = (color, percent) => {
    let r = parseInt(color.substring(1, 3), 16);
    let g = parseInt(color.substring(3, 5), 16);
    let b = parseInt(color.substring(5, 7), 16);

    r = Math.floor(r * (1 - percent));
    g = Math.floor(g * (1 - percent));
    b = Math.floor(b * (1 - percent));

    return `rgb(${r}, ${g}, ${b})`;
  };

  const darkBorderColors = color.map((c) => darkenColor(c, -0.5));

  return (
    <div className="max-w-full mx-autoborder h-screen flex flex-col bg-custom-bg-blue">
      {/* Header */}
      <div className="flex justify-between mb-1 items-center bg-custom-header-blue p-2">
        {/* Circle background for timer */}
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 lg:w-16 lg:h-16 bg-custom-button-yellow rounded-full flex items-center justify-center">
            <span className="text-white text-3xl lg:text-4xl font-semibold">
              {timer}
            </span>
          </div>
        </div>
        <div className="bg-custom-button-blue p-2 rounded">
          <span className=" text-white font-bold text-lg md:text-2xl lg:text-3xl">
            Question {Index + 1} of {gameData.length}
          </span>
        </div>
        <button
          onClick={onclick}
          className="bg-rose-500 text-white rounded-full w-10 h-10 lg:w-16 lg:h-16"
        >
          <span className="text-white text-3xl lg:text-4xl ">X</span>
        </button>
      </div>

      {/* Question Image and Question */}
      <div className="flex-1 flex flex-col items-center justify-center mb-1 p-2">
        {questionImage && (
          <img
            src={questionImage}
            alt="Question"
            className="w-full mb-4 object-contain max-h-52 lg:max-h-64"
          />
        )}
        <div className="text-xl font-semibold text-center text-white lg:text-3xl">
          {question}
        </div>
        {isMultiSelect && (
          <div className="text-sm text-rose-400 mt-2 text-center">
            (This question has multiple correct answers. Select all that apply.)
          </div>
        )}
      </div>

      {/* Options */}
      <div className="flex-1 flex flex-col overflow-auto mb-1 p-2">
        {options && options.length > 0 && (
          <ul className="grid grid-cols-2 gap-1 lg:grid-cols-4 lg:gap-1 h-full">
            {options.map((option, index) => (
              <li
                key={index}
                onClick={() => handleOptionClick(option)}
                className={`p-2 rounded h-full cursor-pointer flex flex-col items-center justify-center ${
                  selectedOptions.includes(option)
                    ? `border-[7px] md:border-[10px] lg:border-[14px] `
                    : ` `
                }`}
                style={{
                  backgroundColor: color[index],
                  borderColor: selectedOptions.includes(option)
                    ? darkBorderColors[index]
                    : "transparent",
                  color: "white",
                  margin: "0",
                  overflow: "hidden",
                }} // Set height and remove gaps
              >
                {optionImages && optionImages[index] && (
                  <img
                    src={optionImages[index]}
                    alt={`Option ${index + 1}`}
                    className="w-full h-3/4 object-contain mb-2"
                  />
                )}
                <div className="relative w-full overflow-hidden">
                  <span className="block font-semibold whitespace-nowrap overflow-hidden text-ellipsis text-center md:text-xl lg:text-3xl">
                    {option}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Buttons */}
      <div className="bg-black p-2 rounded">
        <div className="w-full flex justify-end">
          <button
            onClick={handleNextClick}
            className={`bg-blue-500 text-white py-2 px-4 rounded items-end ${
              showNext ? "" : "opacity-0"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default McqGame;
