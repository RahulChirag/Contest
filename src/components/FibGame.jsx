// /path/to/FibGame.jsx
import React, { useState, useEffect, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const ItemTypes = {
  OPTION: "OPTION",
  BLANK: "BLANK",
};

const FibGame = ({
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
  const [timer, setTimer] = useState(duration);
  const [showNext, setShowNext] = useState(false);
  const [blanks, setBlanks] = useState([]);
  const [options, setOptions] = useState([]);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [score, setScore] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    resetGame();
  }, [currentQuestion]);

  useEffect(() => {
    if (timer > 0 && !isEvaluated) {
      timerRef.current = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0 && !isEvaluated) {
      handleNextClick();
    }
    return () => clearInterval(timerRef.current);
  }, [timer, isEvaluated]);

  useEffect(() => {
    if (!currentQuestion) {
      handleUnlockNextLevel();
    }
  }, [currentQuestion]);

  const handleDrop = (item, targetIndex) => {
    const { option, sourceIndex } = item;
    setShowNext(true);

    setBlanks((prevBlanks) => {
      const newBlanks = [...prevBlanks];
      let newOptions = [...options];

      if (newBlanks[targetIndex]) {
        if (sourceIndex !== undefined) {
          const temp = newBlanks[targetIndex];
          newBlanks[targetIndex] = option;
          newBlanks[sourceIndex] = temp;
        } else {
          const temp = newBlanks[targetIndex];
          newBlanks[targetIndex] = option;
          newOptions = [...newOptions.filter((opt) => opt !== option), temp];
        }
      } else {
        if (sourceIndex !== undefined) {
          newBlanks[sourceIndex] = "";
        } else {
          newOptions = newOptions.filter((opt) => opt !== option);
        }
        newBlanks[targetIndex] = option;
      }

      setOptions(newOptions);
      return newBlanks;
    });
  };

  const handleNextClick = async () => {
    let scoreIncrement = 0;
    let allCorrect = true;

    blanks.forEach((blank, index) => {
      if (blank.trim() === currentQuestion.correctAnswers[index]) {
        scoreIncrement++;
      } else {
        allCorrect = false;
      }
    });

    const scoreToAdd = allCorrect ? Math.ceil(timer) : 0;
    setScore(scoreToAdd);
    if (scoreToAdd > 0) {
      await updateScore(scoreToAdd);
    }

    setIsEvaluated(true);
    setShowNext(true);
    updateQuestionStatus(currentQuestion.id, true, scoreToAdd, blanks);
    resetGame();
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

  const resetGame = () => {
    if (currentQuestion) {
      const numberOfBlanks = currentQuestion.question.split("*").length - 1;
      setBlanks(new Array(numberOfBlanks).fill(""));
      setOptions([...currentQuestion.options]);
      setTimer(duration);
      setIsEvaluated(false);
      setShowNext(false);
      setScore(null);
    }
  };

  const renderQuestion = (text) => {
    if (!text) return null;

    const parts = text.split("*");
    return (
      <div className="flex flex-row justify-center items-center flex-wrap space-x-2">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span className="text-xl font-semibold text-center text-white lg:text-3xl">
              {part}
            </span>
            {index < parts.length - 1 && <Blank index={index} />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderOptions = (options) => {
    if (!options) return null;

    return options.map((option, index) => (
      <Option key={index} option={option} draggable={!isEvaluated} />
    ));
  };

  const DraggableSpan = ({ index, text }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: ItemTypes.BLANK,
      item: { option: text, sourceIndex: index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));

    return (
      <span
        ref={drag}
        className={`flex items-center justify-center p-2 rounded text-center min-h-10 bg-custom-button-yellow text-white border-none ${
          isDragging ? "opacity-50" : "opacity-100"
        } inline-block cursor-move`}
      >
        {text}
      </span>
    );
  };

  const Blank = ({ index }) => {
    const [{ canDrop, isOver }, drop] = useDrop({
      accept: [ItemTypes.OPTION, ItemTypes.BLANK],
      drop: (item) => handleDrop(item, index),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    });

    const isActive = canDrop && isOver;

    return (
      <span
        ref={drop}
        className={`flex items-center justify-center p-2 border-2 border-dashed m-2 rounded text-center min-h-10 ${
          isActive ? "bg-sky-500" : "bg-headerBlue"
        }`}
      >
        {blanks[index] ? (
          <DraggableSpan index={index} text={blanks[index]} />
        ) : (
          "_____"
        )}
      </span>
    );
  };

  const Option = ({ option, draggable = true }) => {
    const [{ isDragging }, drag, preview] = useDrag(() => ({
      type: "OPTION",
      item: { option },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));

    const baseClass =
      "font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis text-center md:text-xl lg:text-3xl bg-custom-button-yellow rounded p-2 ";
    const dragClass = isDragging ? "opacity-0" : "opacity-100";

    return draggable ? (
      <span ref={drag} className={`${baseClass} ${dragClass} cursor-move`}>
        {option}
      </span>
    ) : (
      <span className={`${baseClass} ${dragClass}`}>{option}</span>
    );
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
  }

  return (
    <DndProvider backend={HTML5Backend}>
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
            <span className="text-white font-bold text-lg md:text-2xl lg:text-3xl">
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

        {/* Question */}
        <div className="flex-1 flex flex-col items-center justify-center mb-1 p-2">
          <div className="text-xl font-semibold text-center text-white lg:text-3xl">
            {renderQuestion(currentQuestion?.question)}
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col overflow-auto mb-1 p-2 max-h-64 min-h-48 bg-custom-header-blue ">
          <ul className="flex items-center justify-center space-x-3">
            {renderOptions(options)}
          </ul>
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
    </DndProvider>
  );
};

export default FibGame;
