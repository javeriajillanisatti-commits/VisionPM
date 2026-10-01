import React from "react";

const SaveButton = ({
  text = "Save Changes",
  onClick,
  type = "button",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className="w-full min-h-[42px] sm:min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm  whitespace-nowrap active:scale-[0.98] transition-all shadow-md shadow-indigo-100 dark:shadow-none"
    >
      {text}
    </button>
  );
};

export default SaveButton;
