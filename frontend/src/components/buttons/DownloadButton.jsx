import React from "react";
import { Download } from "lucide-react";

const DownloadButton = ({ text = "Download", onClick }) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 active:scale-[0.97] py-3 px-3 text-[12px] sm:text-sm shadow-sm cursor-pointer"
    >
      <Download size={16} strokeWidth={2.5} className="text-white shrink-0" />
      <span>{text}</span>
    </button>
  );
};

export default DownloadButton;