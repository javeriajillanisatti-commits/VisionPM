import React from "react";
import { Paperclip } from "lucide-react"; // Professional attachment icon

const AttachmentButton = ({ onClick, text = "Add Attachment", disabled = false }) => {
   return (
    
    // Form submission button
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold rounded-lg transition-all duration-300 active:scale-[0.97] shadow-md py-2 px-3 text-xs sm:py-3 sm:px-6 sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
    >
      <Paperclip size={15} strokeWidth={2.5} className="shrink-0 text-white" />
      <span>{text}</span>
    </button>
  );
};

export default AttachmentButton;
