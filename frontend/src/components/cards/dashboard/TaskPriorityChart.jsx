import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "../../../context/ThemeContext";

const PMTaskPriorityChart = ({ data = [] }) => {
  const { isDarkMode } = useTheme();
  const hasData = Array.isArray(data) && data.length > 0 && data.some((item) => item.value > 0);
  const rawData = hasData ? data : [
    { name: "Low Priority", value: 1 },
    { name: "Medium Priority", value: 1 },
    { name: "High Priority", value: 1 },
  ];
  const priorityOrder = ["low priority", "medium priority", "high priority"];  
  const chartData = [...rawData].sort((a, b) => {
    const indexA = priorityOrder.indexOf(a.name?.toString().toLowerCase().trim());
    const indexB = priorityOrder.indexOf(b.name?.toString().toLowerCase().trim());
    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
  });
const getPriorityColor = (name) => {
  const value = name?.toString().toLowerCase().trim();

  if (value?.includes("high")) return "#D96B6B";
  if (value?.includes("medium")) return "#D6A832";
  if (value?.includes("low")) return "#5FAF68";

  return "#94a3b8";
};
  return (
    <div className={`min-h-[400px] h-auto w-full p-4 sm:p-6 rounded-[2rem] border shadow-sm flex flex-col justify-between relative ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-200"}`}>
      <div className="mb-2 sm:mb-4">
        <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
          Task Priority Distribution
        </h3>
        <p className={`text-[12px] font-medium mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}>
          Visual breakdown of tasks based on their priorities.
        </p>
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center font-semibold text-xs relative">
        {!hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none z-20">
            <div className="flex flex-col items-center justify-center max-w-[150px] -translate-y-3">
              <h4 className={`text-xs font-black tracking-wide uppercase ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>All Clear</h4>
              <p className={`text-[9px] font-medium mt-0.5 leading-tight ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}>
                No active priorities logged
              </p>
            </div>
          </div>
        )}

        {/* Responsive pie chart container */}
        <div className="w-full h-[180px] sm:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={hasData ? 4 : 2}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`pm-cell-${index}`}
                    fill={getPriorityColor(entry.name)}
                    stroke={isDarkMode ? "#11182B" : "#FFFFFF"}
                    strokeWidth={1.5}
                    opacity={hasData ? 1 : 0.4}
                  />
                ))}
              </Pie>

              <Tooltip
                content={({ active, payload }) => {
                  if (!hasData || !active || !payload?.length) return null;
                  const entry = payload[0];
                  const segmentColor = getPriorityColor(entry.name);

                  return (
                    <div className={`p-3 rounded-2xl border shadow-2xl space-y-1.5 min-w-[130px] ${isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"}`}>
                      <p className={`text-[12px] font-bold pb-1 border-b ${isDarkMode ? "text-slate-500 border-slate-800" : "text-slate-500 border-slate-100"}`}>
                        {entry.name}
                      </p>
                      <div className="flex justify-between items-center pt-0.5 text-[11px]">
                        <span className="flex items-center gap-1.5 font-medium text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: segmentColor }} />
                          Tasks:
                        </span>
                        <span className="font-bold">{entry.value}</span>
                      </div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Responsive legend */}
        <div className="w-full pt-2 flex justify-center">
          <div className="custom-legend-container flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-[11px]">
            {chartData.map((item, idx) => (
              <div 
                key={idx} 
                className={`legend-item flex items-center gap-1.5 ${item.name?.toLowerCase().includes("high") ? "high-priority-item" : ""}`}
              >
                <span 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: getPriorityColor(item.name) }} 
                />
                <span className={`font-semibold ${isDarkMode ? "text-[#CBD5E1]" : "text-[#475569]"}`}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Breakpoints logic */}
        <style jsx>{`
          @media (max-width: 400px) and (min-width: 301px) {
            .custom-legend-container {
              max-width: 260px;
            }
            .high-priority-item {
              width: 100%;
              justify-content: center;
            }
          }
          @media (max-width: 300px) {
            .custom-legend-container {
              flex-direction: column;
              align-items: center;
              width: 100%;
            }
            .legend-item {
              width: 100%;
              justify-content: center;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PMTaskPriorityChart;