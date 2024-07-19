// McqGame.jsx
import React, { useState } from "react";

const McqGame = ({ currentQuestion, onClickNext, onclick }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isChecked, setIsChecked] = useState(false);

  if (!currentQuestion) {
    return (
      <div className="text-center text-gray-500">No question available</div>
    );
  }

  const { question, questionImage, options, optionImages, answer } =
    currentQuestion;

  const isMultiSelect = Array.isArray(answer) && answer.length > 1;

  const handleOptionClick = (option) => {
    if (isChecked) return;

    if (isMultiSelect) {
      setSelectedOptions((prevSelected) =>
        prevSelected.includes(option)
          ? prevSelected.filter((opt) => opt !== option)
          : [...prevSelected, option]
      );
    } else {
      setSelectedOptions([option]);
      setIsChecked(true);
    }
  };

  const isCorrect = (option) => answer.includes(option);

  const handleCheckClick = () => {
    setIsChecked(true);
  };

  const handleNextClick = () => {};

  return (
    <div className="max-w-full mx-auto p-4 border rounded-lg shadow-lg h-screen">
      {questionImage && (
        <img src={questionImage} alt="Question" className="w-full mb-4" />
      )}
      <div className="text-xl font-semibold mb-4">{question}</div>
      {options && options.length > 0 && (
        <ul className="space-y-2">
          {options.map((option, index) => (
            <li
              key={index}
              onClick={() => handleOptionClick(option)}
              className={`p-2 rounded cursor-pointer ${
                selectedOptions.includes(option)
                  ? isChecked
                    ? isCorrect(option)
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                    : "bg-blue-500 text-white"
                  : "bg-white text-black border"
              }`}
            >
              {optionImages && optionImages[index] && (
                <img
                  src={optionImages[index]}
                  alt={`Option ${index + 1}`}
                  className="inline-block w-6 h-6 mr-2"
                />
              )}
              <span>{option}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex justify-between">
        {isMultiSelect && !isChecked ? (
          <button
            onClick={handleCheckClick}
            className={`bg-blue-500 text-white py-2 px-4 rounded ${
              selectedOptions.length === 0 ? "opacity-0 cursor-not-allowed" : ""
            }`}
            disabled={selectedOptions.length === 0}
          >
            Check
          </button>
        ) : null}
        {isChecked ? (
          <button
            onClick={handleNextClick}
            className="bg-blue-500 text-white py-2 px-4 rounded"
          >
            Next
          </button>
        ) : null}
        <button
          onClick={onclick}
          className="bg-blue-500 text-white py-2 px-4 rounded"
        >
          Close Game
        </button>
      </div>
    </div>
  );
};

export default McqGame;
