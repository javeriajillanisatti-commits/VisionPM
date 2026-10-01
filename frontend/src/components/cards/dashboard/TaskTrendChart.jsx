import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTheme } from "../../../context/ThemeContext";

const TaskTrendChart = ({ data = [] }) => {
  const { isDarkMode } = useTheme();
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const getEntryDay = (entry) => {
    const raw =
      entry?.day ??
      entry?.dayName ??
      entry?.label ??
      entry?.name ??
      entry?.date;

    if (!raw) return "";

    const value = String(raw).trim();
    if (!value) return "";

    const date = new Date(value);

    return !isNaN(date.getTime()) && value.length > 5
      ? date.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase()
      : value.slice(0, 3).toLowerCase();
  };

  const getNumber = (...values) => {
    for (const value of values) {
      if (value !== undefined && value !== null && value !== "") {
        const number = Number(value);
        if (!isNaN(number)) return number;
      }
    }
    return 0;
  };

  const chartData = days.map((day) => {
    const item =
      (Array.isArray(data) &&
        data.find((entry) => getEntryDay(entry) === day.toLowerCase())) ||
      {};

    const todo = getNumber(
      item.todo,
      item.toDo,
      item.todoCount,
      item.todoTasks
    );

    const inProgress = getNumber(
      item.inProgress,
      item.inprogress,
      item.in_progress,
      item.inProgressCount,
      item.inProgressTasks
    );

    const completed = getNumber(
      item.completed,
      item.complete,
      item.completedCount,
      item.completedTasks
    );

    const total = todo + inProgress + completed;

    return {
      day,
      todo: total ? Math.round((todo / total) * 100) : 0,
      inProgress: total ? Math.round((inProgress / total) * 100) : 0,
      completed: total ? Math.round((completed / total) * 100) : 0,
    };
  });

  const hasActivityData = chartData.some(
    ({ todo, inProgress, completed }) =>
      todo > 0 || inProgress > 0 || completed > 0
  );

  const formatLabel = (label) =>
    label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();

  const axisColor = isDarkMode ? "#334155" : "#E2E8F0";
  const textColor = isDarkMode ? "#94A3B8" : "#64748B";

  return (
    <div className="relative w-full h-[280px] sm:h-[320px] lg:h-[340px]">
      <div className="absolute inset-x-0 top-2 sm:top-3 bottom-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 25, right: 12, left: 0, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isDarkMode ? "#263149" : "#F1F5F9"}
            />

            <XAxis
              dataKey="day"
              axisLine={{ stroke: axisColor, strokeWidth: 1.5 }}
              tickLine={false}
              tick={{
                fill: textColor,
                fontSize: 10,
                fontWeight: "600",
              }}
              dy={8}
              interval={0}
            />

            <YAxis
              allowDecimals={false}
              axisLine={{ stroke: axisColor, strokeWidth: 1.5 }}
              tickLine={false}
              width={42}
              tick={{
                fill: textColor,
                fontSize: 10,
                fontWeight: "600",
              }}
              type="number"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(value) => `${value}%`}
              padding={{ top: 20, bottom: 20 }}
            />

            <Tooltip
              cursor={{
                stroke: isDarkMode ? "#475569" : "#CBD5E1",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              contentStyle={{
                borderRadius: "12px",
                border: `1px solid ${
                  isDarkMode ? "#263149" : "#E2E8F0"
                }`,
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.15)",
                fontSize: "11px",
                fontWeight: "600",
                backgroundColor: isDarkMode ? "#11182B" : "#FFFFFF",
                color: isDarkMode ? "#FFFFFF" : "#374151",
              }}
              itemStyle={{
                color: isDarkMode ? "#FFFFFF" : "#374151",
              }}
              formatter={(value, name) => [
                `${value}%`,
                formatLabel(name),
              ]}
            />

            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{
                fontSize: "10px",
                fontWeight: "600",
                letterSpacing: "0.03em",
                paddingTop: "12px",
                color: isDarkMode ? "#CBD5E1" : "#374151",
              }}
            />

            {[
              ["todo", "To Do", "#3B82F6"],
              ["inProgress", "In Progress", "#F59E0B"],
              ["completed", "Completed", "#10B981"],
            ].map(([key, name, color]) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={name}
                stroke={color}
                strokeWidth={hasActivityData ? 2.5 : 1.8}
                strokeDasharray={hasActivityData ? undefined : "6 5"}
                opacity={hasActivityData ? 1 : 0.3}
                dot={hasActivityData ? { r: 3, strokeWidth: 1 } : false}
                activeDot={hasActivityData ? { r: 5 } : false}
                isAnimationActive={hasActivityData}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {!hasActivityData && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center px-3 pt-4">
          <div
            className={`px-3 sm:px-4 py-2.5 rounded-xl border shadow-sm backdrop-blur-sm ${
              isDarkMode
                ? "bg-[#11182B]/90 border-[#263149] text-gray-300"
                : "bg-white/90 border-gray-200 text-gray-500"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isDarkMode ? "bg-slate-500" : "bg-slate-300"
                }`}
              />

              <span className="text-[11px] sm:text-xs font-semibold tracking-wide text-center">
                No activity recorded this week
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTrendChart;