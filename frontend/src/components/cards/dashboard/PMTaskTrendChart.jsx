import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "../../../context/ThemeContext";

const PMTaskTrendChart = ({ data = [] }) => {
  const { isDarkMode } = useTheme();
  const hasData = Array.isArray(data) && data.length > 0 && data.some(
    (item) => item.todo > 0 || item.inProgress > 0 || item.completed > 0
  );

  const chartData = hasData ? data.slice(-7) : [
    { day: "Sun", todo: 0, inProgress: 0, completed: 0 },
    { day: "Mon", todo: 0, inProgress: 0, completed: 0 },
    { day: "Tue", todo: 0, inProgress: 0, completed: 0 },
    { day: "Wed", todo: 0, inProgress: 0, completed: 0 },
    { day: "Thu", todo: 0, inProgress: 0, completed: 0 },
    { day: "Fri", todo: 0, inProgress: 0, completed: 0 },
    { day: "Sat", todo: 0, inProgress: 0, completed: 0 },
  ];

  // Sequence Order: To Do -> In Progress -> Completed
  const legendsList = [
    { name: "To Do", key: "todo", color: "#3b82f6" },
    { name: "In Progress", key: "inProgress", color: "#f59e0b" },
    { name: "Completed", key: "completed", color: "#22c55e" }
  ];

  return (
    <div className={`min-h-[400px] h-auto w-full p-4 sm:p-6 rounded-[2rem] border shadow-sm flex flex-col justify-between relative ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-200"}`}>
      <div className="mb-2 sm:mb-4">
        <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
          7 Days Task Creation Trend
        </h3>
        <p className={`text-[12px] font-medium mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}>
          Weekly tracker for created, ongoing, and completed tasks over the last 7 days.
        </p>
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center font-semibold text-xs relative">
        {!hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none z-20">
            <div className="flex flex-col items-center justify-center max-w-[200px] translate-y-[-20px]">
              <h4 className={`text-xs font-black uppercase ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                All Caught Up
              </h4>
              <p className={`text-[10px] font-medium mt-0.5 leading-tight ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}>
                No task activity recorded this week
              </p>
            </div>
          </div>
        )}

        {/* Flexible height chart container */}
        <div className="w-full h-[180px] sm:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#263149" : "#F1F5F9"} />
              <XAxis dataKey="day" tickLine={false} tick={{ fill: isDarkMode ? "#94A3B8" : "#64748B", fontSize: 10, fontWeight: "600" }} dy={8} />
              <YAxis allowDecimals={false} tickLine={false} width={55} tick={{ fill: isDarkMode ? "#94A3B8" : "#64748B", fontSize: 10, fontWeight: "600" }} />

              <Tooltip
                wrapperStyle={{ zIndex: 100 }}
                cursor={hasData ? { stroke: isDarkMode ? "#475569" : "#CBD5E1", strokeWidth: 1.2, strokeDasharray: "5 5" } : false}
                content={({ active, payload, label }) => active && payload?.length ? (
                  <div className={`p-3 rounded-2xl border shadow-2xl space-y-1.5 min-w-[130px] ${isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"}`}>
                    <p className={`text-[12px] font-bold pb-1 border-b ${isDarkMode ? "text-slate-400 border-slate-800" : "text-slate-500 border-slate-100"}`}>
                      {label} Activity
                    </p>
                    <div className="space-y-1 pt-0.5 text-[11px]">
                      {payload.map((item, index) => (
                        <div key={index} className="flex justify-between items-center gap-4">
                          <span className="flex items-center gap-1.5 font-medium text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.stroke }} />
                            {item.name}:
                          </span>
                          <span className="font-bold">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              />

              <Line type="monotone" dataKey="todo" name="To Do" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: hasData ? 3 : 2 }} className={!hasData ? "opacity-40" : ""} />
              <Line type="monotone" dataKey="inProgress" name="In Progress" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: hasData ? 3 : 2 }} className={!hasData ? "opacity-40" : ""} />
              <Line type="monotone" dataKey="completed" name="Completed" stroke="#22c55e" strokeWidth={2.5} dot={{ r: hasData ? 3 : 2 }} className={!hasData ? "opacity-40" : ""} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Responsive Legend */}
        <div className="w-full pt-2 flex justify-center">
          <div className="custom-legend-container flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-[11px]">
            {legendsList.map((item, idx) => (
              <div 
                key={idx} 
                className={`legend-item flex items-center gap-1.5 ${item.key === "completed" ? "completed-item" : ""}`}
              >
                <span 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: item.color }} 
                />
                <span className={`font-semibold ${isDarkMode ? "text-[#CBD5E1]" : "text-[#475569]"}`}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Responsive CSS Breakpoints */}
        <style jsx>{` @media (max-width: 400px) and (min-width: 301px) {  .custom-legend-container {  max-width: 260px;}
            .completed-item { width: 100%;  justify-content: center;  } }
          @media (max-width: 300px) {.custom-legend-container {  flex-direction: column;  align-items: center;  width: 100%; }
            .legend-item { width: 100%;  justify-content: center;  } } `}</style>
      </div>
    </div>
  );
};

export default PMTaskTrendChart;