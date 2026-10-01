import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { AlertCircle, Clock, CalendarDays, CalendarClock } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";

const TaskDeadlineChart = ({ data = [] }) => {
  const { isDarkMode } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

 const deadlineColors = {
  Overdue: "#D96565",
  "Due Today": "#459E91",
  "Due This Week": "#C85F8E",
  Upcoming: "#718292",
};

  const deadlineIcons = {
    Overdue: AlertCircle,
    "Due Today": Clock,
    "Due This Week": CalendarDays,
    Upcoming: CalendarClock,
  };

  const formatLabel = (label = "") =>
    label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();

  const chartData = data.filter((item) => item && Number(item.value) > 0);
  const totalTasks = chartData.reduce(
    (sum, item) => sum + Number(item.value),
    0
  );

  const hasData = totalTasks > 0;

  const emptyChartData = [
    { name: "Overdue", value: 1 },
    { name: "Due Today", value: 1 },
    { name: "Due This Week", value: 1 },
    { name: "Upcoming", value: 1 },
  ];

  const displayChartData = hasData ? chartData : emptyChartData;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center py-1 overflow-hidden">
      <div className="w-full h-full max-w-[520px] mx-auto flex flex-col items-center justify-center gap-3 px-2 overflow-hidden">
        <div className="relative aspect-square h-[75%] max-h-[240px] min-h-[150px] w-auto mx-auto">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="100%"
                paddingAngle={hasData ? 3 : 2}
                stroke="none"
                isAnimationActive={false}
              >
                {displayChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={deadlineColors[entry.name] || "#94A3B8"}
                    opacity={hasData ? 1 : 0.35}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(value) => [hasData ? value : 0, "Tasks"]}
              />
            </PieChart>
          </ResponsiveContainer>

          <div
            className="absolute top-1/2 left-1/2 flex flex-col items-center justify-center text-center pointer-events-none leading-none"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            {hasData ? (
              <>
                <span
                  className={`text-2xl sm:text-3xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  {totalTasks}
                </span>

                <span
                  className={`text-[11px] sm:text-xs font-semibold mt-1 whitespace-nowrap ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {chartData.length === 1
                    ? `${formatLabel(chartData[0].name)} ${
                        totalTasks === 1 ? "Task" : "Tasks"
                      }`
                    : `${totalTasks} ${
                        totalTasks === 1 ? "Pending task" : "Pending tasks"
                      }`}
                </span>
              </>
            ) : (
              <>
                <span
                  className={`text-xl sm:text-2xl font-bold tracking-tight ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  0%
                </span>

                <span
                  className={`text-[11px] sm:text-xs font-semibold mt-1 text-center leading-tight ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  All caught up!
                </span>
              </>
            )}
          </div>
        </div>

        {!hasData && (
          <div className="text-center -mt-1 mb-4 sm:mb-5">
            <p
              className={`text-xs sm:text-sm font-medium ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              No pending deadlines right now.
            </p>

            <p
              className={`text-[10px] sm:text-xs mt-1 px-2 ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Great job! All project deadlines are currently clear.
            </p>
          </div>
        )}

        <div
          className="w-full max-w-full items-center justify-center"
          style={
            isMobile
              ? {
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  columnGap: "16px",
                  rowGap: "8px",
                }
              : {
                  display: "flex",
                  flexWrap: "nowrap",
                  columnGap: "16px",
                  overflowX: "auto",
                  paddingBottom: "2px",
                }
          }
        >
          {Object.keys(deadlineIcons).map((name) => {
            const Icon = deadlineIcons[name];
            const item = data.find((entry) => entry?.name === name);
            const value = Number(item?.value) || 0;

            return (
              <div
                key={name}
                className="flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                <Icon
                  size={isMobile ? 13 : 14}
                  strokeWidth={2}
                  className={`flex-shrink-0 ${!hasData ? "opacity-30" : ""}`}
                  style={{ color: deadlineColors[name] || "#94A3B8" }}
                />

                <span
                  className={`text-[10px] sm:text-xs font-medium truncate ${
                    !hasData
                      ? isDarkMode
                        ? "text-gray-500"
                        : "text-gray-400"
                      : isDarkMode
                      ? "text-gray-300"
                      : "text-gray-600"
                  }`}
                >
                  {formatLabel(name)}
                </span>

                <span
                  className={`text-[10px] sm:text-xs font-bold flex-shrink-0 ${
                    !hasData
                      ? isDarkMode
                        ? "text-gray-500"
                        : "text-gray-400"
                      : isDarkMode
                      ? "text-gray-200"
                      : "text-gray-800"
                  }`}
                >
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TaskDeadlineChart;