import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { FolderKanban } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";

const ProjectProgressChart = ({ data = [], userRole = "projectmanager" }) => {
  const { isDarkMode } = useTheme();
  const [screenWidth, setScreenWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    const resize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const isMobile = screenWidth < 640;
  const isTablet = screenWidth >= 640 && screenWidth < 1024;
  const cleanRole = userRole?.toString().toLowerCase().replace(/\s+/g, "");
  const isAdmin = cleanRole === "projectadmin" || cleanRole === "admin";

  // Calculate progress from task status values
  const getTaskProgress = (status) => {
    const value = status?.toString().trim().toLowerCase();
    return value === "completed" ? 100 : ["in progress", "in-progress", "inprogress"].includes(value) ? 50 : 0;
  };

  const chartData = data?.length ? data.map((item) => {
    const todo = Math.max(0, Number(item.todo) || 0);
    const inProgress = Math.max(0, Number(item.inProgress) || 0);
    const completed = Math.max(0, Number(item.completed) || 0);
    const totalTasks = todo + inProgress + completed;
    const progress = totalTasks
      ? Math.round((inProgress * 50 + completed * 100) / totalTasks)
      : getTaskProgress(item.status);

    return { ...item, progress, todo, inProgress, completed, totalTasks, displayProgress: progress || 2 };
  }) : [];

  const emptyChartData = Array.from({ length: 5 }, (_, i) => ({ name: `Project ${i + 1}`, progress: 0 }));
  const truncateLabel = (value, max) => {
    const text = value ? String(value) : "No Data";
    return text.length > max ? `${text.substring(0, max)}...` : text;
  };

  const axisStroke = isDarkMode ? "#334155" : "#E2E8F0";
  const gridStroke = isDarkMode ? "#263149" : "#F1F5F9";
  const tickColor = isDarkMode ? "#94A3B8" : "#475569";
  const axisProps = { axisLine: { stroke: axisStroke, strokeWidth: 1.5 }, tickLine: false };
  const xAxisAngle = isMobile ? -45 : isTablet ? -30 : 0;
  const xAxisTextAnchor = isMobile || isTablet ? "end" : "middle";
  const xAxisHeight = isMobile ? 70 : isTablet ? 55 : 30;
  const xAxisLabelLength = isMobile ? 13 : isTablet ? 16 : 9;
  const chartBottomMargin = isMobile ? 25 : isTablet ? 20 : 15;

  const yAxis = (
    <YAxis {...axisProps} allowDecimals={false} width={42} tick={{ fill: tickColor, fontSize: 10, fontWeight: "600" }}
      type="number" domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(value) => `${value}%`} />
  );

  // Keep chart layout and empty state consistent
  const chart = (chartItems, empty = false) => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartItems} margin={{ top: 10, right: 5, left: -10, bottom: chartBottomMargin }} barCategoryGap="30%">
        {!empty && (
          <defs>
            <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.95} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.75} />
            </linearGradient>
          </defs>
        )}
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
        <XAxis {...axisProps} dataKey="name" angle={xAxisAngle} textAnchor={xAxisTextAnchor} height={xAxisHeight}
          tick={{ fill: empty ? isDarkMode ? "#64748B" : "#CBD5E1" : tickColor, fontSize: 9, fontWeight: "600" }}
          dy={8} interval={0} tickFormatter={(value) => truncateLabel(value, xAxisLabelLength)} />
        {yAxis}

        {!empty && (
          <Tooltip
            cursor={{ fill: isDarkMode ? "#1E293B" : "#F8FAFC", opacity: 0.45 }}
            wrapperStyle={{ backgroundColor: "transparent" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0]?.payload;
              if (!item) return null;
              const progress = Number(item.progress) || 0;

              return (
                <div className={`p-3 shadow-2xl space-y-1.5 text-[11px] font-semibold max-w-[240px] sm:max-w-[280px] ${isDarkMode ? "bg-[#0F172A] border-[#263149] text-white" : "bg-white border-gray-200 text-slate-800"}`}>
                  <p className={`font-bold text-xs mb-1 break-words ${isDarkMode ? "text-gray-100" : "text-slate-900"}`}>
                    {item.name || item.projectName || "Unnamed Project"}
                  </p>
                  <p>Overall Progress: <span className={progress === 0 ? isDarkMode ? "text-gray-300" : "text-gray-500" : progress >= 100 ? "text-emerald-400" : "text-blue-400"}>{progress}%</span></p>
                  {progress === 0 && <p className={isDarkMode ? "text-slate-400" : "text-slate-500"}>No progress recorded yet</p>}
                  {isAdmin && (
                    <div className={`pt-1.5 mt-1 border-t space-y-0.5 ${isDarkMode ? "border-slate-700" : "border-gray-200"}`}>
                      <p className={`text-[10px] uppercase tracking-wider mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Task Breakdown:</p>
                      <p>To Do: <span className="text-blue-400">{item.todo || 0}</span></p>
                      <p>In Progress: <span className="text-amber-400">{item.inProgress || 0}</span></p>
                      <p>Completed: <span className="text-emerald-400">{item.completed || 0}</span></p>
                      <p>Total Tasks: <span className={isDarkMode ? "text-gray-200" : "text-slate-700"}>{item.totalTasks || 0}</span></p>
                    </div>
                  )}
                </div>
              );
            }}
          />
        )}

        <Bar dataKey={empty ? "progress" : "displayProgress"} barSize={26} radius={[6, 6, 2, 2]}
          isAnimationActive={!empty} animationDuration={1200} animationEasing="ease-out">
          {chartItems.map((entry, index) => {
            const progress = Number(entry.progress) || 0;
            return (
              <Cell key={`${empty ? "empty-project" : "progress"}-${index}`}
                fill={empty ? isDarkMode ? "#334155" : "#E2E8F0" : progress === 0 ? isDarkMode ? "#475569" : "#CBD5E1" : progress >= 100 ? "#34D399" : progress === 50 ? "#FDBA74" : "url(#progressGradient)"}
                fillOpacity={empty ? isDarkMode ? 0.35 : 0.7 : progress === 0 ? 0.55 : 1} />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className={`h-[320px] sm:h-[340px] lg:h-[360px] w-full p-4 sm:p-6 lg:p-8 rounded-[1.25rem] border transition-all duration-300 flex flex-col ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-100"}`}>
      {/* Chart heading */}
      <div className="mb-3 sm:mb-4 shrink-0">
        <h3 className={`text-base sm:text-lg font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Project Progress Analysis
        </h3>
        <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Overall progress across all active projects
        </p>
      </div>

      <div className="flex-1 min-h-0 w-full font-semibold text-xs relative">
        {chartData.length ? chart(chartData) : (
          <>
            {chart(emptyChartData, true)}
            {/* Fixed positioning: pl-10 ( ya left offset ) taake Y-axis aur labels se overlap na ho aur bilkul center mein aaye */}
            <div className="absolute inset-0 pl-10 pb-6 flex items-center justify-center pointer-events-none z-20">
              <div className={`flex flex-col items-center justify-center text-center px-5 py-4 rounded-2xl shadow-xl border ${isDarkMode ? "bg-[#11182B] border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}>
                <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-2 sm:mb-3 border ${isDarkMode ? "bg-blue-500/10 border-blue-500/10" : "bg-blue-50 border-blue-100"}`}>
                  <FolderKanban size={24} strokeWidth={1.8} className={isDarkMode ? "text-blue-400" : "text-blue-500"} />
                </div>
                <p className={`text-xs sm:text-sm font-bold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>No Projects Found</p>
                <p className={`text-[10px] sm:text-[11px] mt-1 max-w-[220px] sm:max-w-[260px] leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Create a project to start tracking progress analytics.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectProgressChart;