import React from "react";

const InviteButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className="w-full sm:w-auto flex items-center bg-blue-600 hover:bg-blue-700 justify-center space-x-2 border border-blue-600 rounded-xl px-6 py-2.5 font-bold text-white transition-all shadow-sm active:scale-95 text-sm whitespace-nowrap shrink-0 cursor-pointer"
    >
      <span>Invite</span>
    </button>
  );
};

export default InviteButton;