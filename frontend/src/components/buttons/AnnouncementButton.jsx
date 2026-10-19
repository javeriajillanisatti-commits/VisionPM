import React from "react";
import { Plus } from "lucide-react";

const AnnouncementButton = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all active:scale-95"
    >
      <Plus size={17} />
      New Announcement
    </button>
  );
};

export default AnnouncementButton;