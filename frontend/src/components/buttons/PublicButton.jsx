import React from "react";

const PublicButton = ({ text, onClick, type = "button" }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className="w-full bg-gradient-to-r from-blue-600 to-black text-white font-bold rounded-xl py-3 px-6 text-sm uppercase tracking-wider active:scale-[0.98] transition-all"
    >
      {text}
    </button>
  );
};

export default PublicButton;
