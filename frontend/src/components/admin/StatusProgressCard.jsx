import React from "react";
import { useTheme } from "../../context/ThemeContext";

const StatusProgressCard = ({ title, count, percentage, barColor }) => {
  const { isDarkMode } = useTheme();
  const normalizedTitle = title?.toString().trim().toLowerCase();
  const finalBarColor = normalizedTitle === "planning" ? "bg-blue-500" : normalizedTitle === "completed" ? "bg-emerald-500" : barColor;

  // Show task status progress
  return (
    <div
      className={`p-3 sm:p-4 rounded-[1.25rem] border shadow-sm space-y-4 hover:shadow-md transition-all ${
        isDarkMode
          ? "bg-[#11182B] border-[#263149]"
          : "bg-white border-gray-100"
      }`}
    >
      <div className="flex justify-between items-start">
        <p className={`text-lg font-bold ${isDarkMode ? "text-gray-300" : "text-black"}`}>
          {title}
        </p>
        <span className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
          {count}
        </span>
      </div>

      <div
        className={`h-1.5 w-full rounded-full overflow-hidden ${
          isDarkMode ? "bg-[#263149]" : "bg-gray-300"
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-1000 ${finalBarColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className={`text-[13px] font-bold ${isDarkMode ? "text-gray-400" : "text-black"}`}>
        {percentage}% of total tasks
      </p>
    </div>
  );
};

export default StatusProgressCard;