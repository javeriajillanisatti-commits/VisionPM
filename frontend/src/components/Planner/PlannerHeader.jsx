import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const PlannerHeader = ({ selectedDate, onPrev, onNext, onToday }) => {
  const { isDarkMode } = useTheme();

  // Format selected date
  const displayDate = new Date(selectedDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const text = isDarkMode ? "text-white" : "text-gray-900";
  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const panel = isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-200";

  return (
    <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
      <div className="min-w-0">
        <h1 className={`text-3xl font-bold tracking-tight ${text}`}>My Work Planner</h1>
        <p className={`text-sm mt-1 ${muted}`}>Plan and organize your assigned work.</p>
      </div>

      <div className={`w-full sm:w-auto flex items-center justify-between sm:justify-start gap-1 sm:gap-2 rounded-xl p-1.5 shadow-sm border ${panel}`}>
        <button
          type="button"
          onClick={onPrev}
          className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-100"}`}
        >
          <ChevronLeft size={18} className={isDarkMode ? "text-gray-300" : "text-gray-600"} />
        </button>

        <span className={`text-xs sm:text-sm font-bold px-1 sm:px-2 min-w-0 sm:min-w-[140px] text-center ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
          {displayDate}
        </span>

        <button
          type="button"
          onClick={onNext}
          className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-100"}`}
        >
          <ChevronRight size={18} className={isDarkMode ? "text-gray-300" : "text-gray-600"} />
        </button>

        <button
          type="button"
          onClick={onToday}
          className={`ml-2 px-3 py-2 text-xs font-bold rounded-lg ${isDarkMode ? "text-blue-400 hover:bg-blue-500/10" : "text-blue-600 hover:bg-blue-50"}`}
        >
          Today
        </button>
      </div>
    </div>
  );
};

export default PlannerHeader;