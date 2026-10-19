import React from "react";

const PrimaryButton = ({
  text,
  onClick,
  type = "button",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-300 active:scale-[0.97] shadow-md py-2 px-3 text-xs sm:py-3 sm:px-6 sm:text-base whitespace-nowrap overflow-hidden text-ellipsis"
    >
      {text}
    </button>
  );
};

export default PrimaryButton;