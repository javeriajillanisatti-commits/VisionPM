import React from "react";
import useCountUp from "../../hooks/useCountUp";

const StatsCard = ({
  title,
  count,
  icon,
  bgColor,
  iconColor,
  subText,
  animate = true,
}) => {
  const animatedValue = useCountUp(animate ? count : 0, 1000);

  return (
    <div className="group w-full min-w-0 bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-2xl sm:rounded-[1.25rem] border border-gray-200 dark:border-slate-800 shadow-sm sm:shadow-md transition-all duration-300 hover:shadow-lg hover:border-gray-300 dark:hover:border-slate-700 flex flex-col justify-between min-h-[80px] sm:min-h-[115px]">

      {/* Top Section */}
      <div className="flex items-start justify-between gap-2 w-full">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] sm:text-[17px] font-bold text-slate-800 dark:text-slate-200 leading-snug break-words">
            {title}
          </p>
        </div>

        {/* Icon */}
        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl shrink-0 flex items-center justify-center shadow-xs ${bgColor} ${iconColor}`}>
          {React.cloneElement(icon, {
            size: 14,
            className: "transition-transform duration-300 group-hover:scale-110",
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-auto pt-2 sm:pt-1 w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-none tracking-tight">
          {animatedValue}
        </h2>

        {subText && (
          <p className="mt-1 text-[10px] font-medium text-gray-400 dark:text-slate-500 truncate">
            {subText}
          </p>
        )}
      </div>

    </div>
  );
};

export default StatsCard;
