import React, { useState } from "react";
import { CalendarDays, CalendarRange, Milestone, Clock, AlertTriangle, ShieldCheck, Layers, ChevronLeft, ChevronRight } from "lucide-react";

const ProjectTimeline = ({ projects = [] }) => {
  const currentYear = new Date().getFullYear();
  const [zoomMode, setZoomMode] = useState("yearly"); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const validProjects = projects.filter(p => p.startDate && (p.deadline || p.endDate));

  let timelineStartMs = new Date(currentYear, 0, 1).getTime();
  let timelineEndMs = new Date(currentYear, 11, 31).getTime();

  if (validProjects.length > 0) {
    const datesPool = [];
    validProjects.forEach(p => {
      datesPool.push(new Date(p.startDate).getTime());
      datesPool.push(p.deadline || p.endDate ? new Date(p.deadline || p.endDate).getTime() : new Date(p.startDate).getTime());
    });
    timelineStartMs = Math.min(...datesPool);
    timelineEndMs = Math.max(...datesPool);
    
    const paddingDaysBuffer = 5 * 24 * 60 * 60 * 1000;
    timelineStartMs -= paddingDaysBuffer;
    timelineEndMs += paddingDaysBuffer;
  }

  const totalTimelineDurationMs = timelineEndMs - timelineStartMs;

  const getMonthAndWeekFromTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const monthLabel = date.toLocaleDateString("en-US", { month: "short" });
    const dayOfMonth = date.getDate();
    const calculatedWeek = Math.min(4, Math.floor((dayOfMonth - 1) / 7) + 1);
    
    return { monthLabel, calculatedWeek };
  };

  const getColumnsConfig = () => {
    const cols = [];
    let stepsCount = 6; 

    if (zoomMode === "weeks") stepsCount = 12;      
    else if (zoomMode === "months") stepsCount = 12; 
    else if (zoomMode === "yearly") stepsCount = 4;  

    const stepIntervalMs = totalTimelineDurationMs / stepsCount;
    let rollingTime = timelineStartMs;

    for (let i = 0; i < stepsCount; i++) {
      const targetDate = new Date(rollingTime);
      let headingLabel = "";
      let secondaryLabel = "";

      if (zoomMode === "weeks") {
        const { monthLabel, calculatedWeek } = getMonthAndWeekFromTimestamp(rollingTime);
        headingLabel = `Week ${calculatedWeek}`;
        secondaryLabel = `${monthLabel}`;
      } else if (zoomMode === "months") {
        headingLabel = targetDate.toLocaleDateString("en-US", { month: "short" });
        secondaryLabel = targetDate.toLocaleDateString("en-US", { year: "2-digit" });
      } else {
        headingLabel = `Quarter ${(Math.floor(targetDate.getMonth() / 3) + 1)}`;
        secondaryLabel = targetDate.toLocaleDateString("en-US", { year: "numeric" });
      }

      cols.push({ id: `col-${i}`, label: headingLabel, subLabel: secondaryLabel, timestamp: rollingTime });
      rollingTime += stepIntervalMs;
    }
    return cols;
  };

  const currentScaleColumns = getColumnsConfig();
  const columnsCount = currentScaleColumns.length;

  const totalPages = Math.ceil(validProjects.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedProjects = validProjects.slice(indexOfFirstItem, indexOfLastItem);

  const computedChartData = paginatedProjects.map((p) => {
    const projStartMs = new Date(p.startDate).getTime();
    const projEndMs = p.deadline || p.endDate ? new Date(p.deadline || p.endDate).getTime() : projStartMs + (7 * 24 * 60 * 60 * 1000);

    let leftPercent = ((projStartMs - timelineStartMs) / totalTimelineDurationMs) * 100;
    let widthPercent = ((projEndMs - projStartMs) / totalTimelineDurationMs) * 100;

    if (leftPercent < 0) leftPercent = 0;
    if (leftPercent > 100) leftPercent = 95;
    if (leftPercent + widthPercent > 100) {
      widthPercent = 100 - leftPercent;
    }

    const statusStr = (p.status || "Planning").toString().trim().toLowerCase();
    
    let barColor = "bg-slate-500 text-white"; 
    if (statusStr === "completed") barColor = "bg-emerald-500 text-white"; 
    else if (statusStr === "in progress") barColor = "bg-amber-500 text-white";
    else if (statusStr === "planning") barColor = "bg-blue-500 text-white"; 
    else if (statusStr === "on hold") barColor = "bg-gray-500 text-white"; 
    else if (statusStr === "cancel" || statusStr === "cancelled") barColor = "bg-rose-500 text-white";

    return {
      id: p._id || p.id || Math.random().toString(),
      projectName: p.projectName || p.title || "Untitled Project",
      left: leftPercent,
      width: Math.max(4, widthPercent),
      displayStart: formatDateLabel(p.startDate),
      displayEnd: formatDateLabel(p.deadline || p.endDate),
      durationDays: Math.max(1, Math.round((projEndMs - projStartMs) / (1000 * 60 * 60 * 24))),
      status: p.status || "Planning",
      barClass: barColor
    };
  });

  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[2rem] border border-gray-200 dark:border-slate-800 shadow-sm min-h-[620px] h-auto flex flex-col w-full transition-all duration-300 overflow-visible relative z-10">
      <div className="mb-4 shrink-0 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 px-1 border-b border-slate-100 dark:border-slate-800 pb-4 w-full">
        <div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Project Gantt Timeline</h3>
          <p className="text-[12px] text-gray-600 dark:text-slate-500 font-medium mt-0.5">Visual schedule tracker for checking project durations.</p>
        </div>

        {/* Responsive Filter Container */}
        <div className="flex flex-wrap sm:flex-nowrap gap-1 bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800/60 rounded-2xl p-1 w-full max-w-full overflow-x-auto sm:w-fit shrink-0 h-fit">
          <button 
            type="button"
            onClick={() => { setZoomMode("weeks"); setCurrentPage(1); }}
            className={`flex-1 sm:flex-none px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer ${
              zoomMode === "weeks" ? "bg-blue-600 text-white" : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/80 hover:text-gray-800 dark:hover:text-slate-200"
            }`}
          >
            <CalendarRange size={13} className={zoomMode === "weeks" ? "text-white" : "text-blue-500"} />
            <span>Weeks Scale</span>
          </button>
          
          <button 
            type="button"
            onClick={() => { setZoomMode("months"); setCurrentPage(1); }}
            className={`flex-1 sm:flex-none px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer ${
              zoomMode === "months" ? "bg-blue-600 text-white" : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/80 hover:text-gray-800 dark:hover:text-slate-200"
            }`}
          >
            <CalendarDays size={13} className={zoomMode === "months" ? "text-white" : "text-purple-500"} />
            <span>Months View</span>
          </button>
          
          <button 
            type="button"
            onClick={() => { setZoomMode("yearly"); setCurrentPage(1); }}
            className={`flex-1 sm:flex-none px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer ${
              zoomMode === "yearly" ? "bg-blue-600 text-white" : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/80 hover:text-gray-800 dark:hover:text-slate-200"
            }`}
          >
            <Milestone size={13} className={zoomMode === "yearly" ? "text-white" : "text-emerald-500"} />
            <span>Yearly Plan</span>
          </button>
        </div>
      </div>

      {/* Container with horizontal scroll */}
      <div className="flex-1 border border-slate-100 dark:border-slate-800/80 rounded-2xl relative bg-slate-50/10 dark:bg-slate-900/10 overflow-x-auto overflow-y-auto w-full mb-4 z-20">
        
        <div 
          className="h-full flex flex-col justify-start overflow-visible"
          style={{ minWidth: zoomMode === "yearly" ? "1000px" : "1400px" }}
        >
          
          {/* Timeline Grid Heading Columns */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none shrink-0 w-full sticky top-0 z-30 shadow-sm">
            <div className="w-[180px] bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 text-[12px] font-black text-slate-600 flex items-center gap-1.5 shrink-0">
              <Layers size={11} /> Project Name
            </div>
            
            <div 
              className="flex-1 grid divide-x divide-slate-100 dark:divide-slate-800"
              style={{ gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))` }}
            >
              {currentScaleColumns.map((col) => (
                <div key={col.id} className="p-3 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 min-w-0">
                  <span className="text-[14px] font-bold text-slate-700 dark:text-slate-300 truncate block w-full">{col.label}</span>
                  <span className="text-[12px] font-bold text-slate-400 dark:text-slate-600 truncate block w-full mt-0.5">{col.subLabel}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Project Row Grid Nodes */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white/40 dark:bg-slate-900/20 w-full flex flex-col justify-start flex-1 overflow-visible">
            {computedChartData.length > 0 ? (
              computedChartData.map((project, index) => {
                const isLastRow = index === computedChartData.length - 1;
                const isSecondToLast = index === computedChartData.length - 2 && computedChartData.length > 2;
                
                const useTopTooltip = isLastRow || isSecondToLast;
                const useRightTooltipAlign = project.left < 15;
                const useLeftTooltipAlign = project.left > 75;

                return (
                  <div key={project.id} className="h-16 flex group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all duration-200 items-center select-none relative z-20 hover:z-50 overflow-visible w-full shrink-0">
                    
                    <div className="w-[180px] border-r border-slate-200 dark:border-slate-800 h-full px-3 bg-white dark:bg-slate-900 shrink-0 flex items-center relative z-20">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block w-full tracking-tight cursor-default">
                        {project.projectName}
                      </span>
                    </div>

                    <div className="flex-1 h-full relative flex items-center px-0 overflow-visible z-30">
                      <div 
                        className="absolute inset-0 grid divide-x divide-slate-100/60 dark:divide-slate-800/40 pointer-events-none"
                        style={{ gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))` }}
                      >
                        {currentScaleColumns.map((c) => <div key={c.id} className="h-full"></div>)}
                      </div>

                      <div 
                        className={`absolute h-4 ${project.barClass} rounded-full cursor-pointer transition-all duration-200 group/bar z-30`}
                        style={{ left: `${project.left}%`, width: `${project.width}%` }}
                      >
                        <div className={`absolute flex-col w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl p-3.5 shadow-2xl space-y-2 text-[11px] font-semibold pointer-events-none z-[9999] hidden group-hover/bar:flex ${
                          useTopTooltip ? 'bottom-full mb-3' : 'top-full mt-3'
                        } ${
                          useRightTooltipAlign ? 'left-0 translate-x-0' : useLeftTooltipAlign ? 'right-0 translate-x-0' : 'left-1/2 -translate-x-1/2'
                        }`}>
                          <div className={`absolute h-1 w-8 bg-blue-500 rounded-full left-4 ${useTopTooltip ? 'bottom-0' : 'top-0'}`} />
                          
                          <p className="text-slate-900 dark:text-white font-bold text-xs tracking-tight truncate border-b border-slate-100 dark:border-slate-800 pb-2 mb-0">{project.projectName}</p>
                          
                          <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
                            <Clock size={11} className="text-blue-500 dark:text-slate-500 shrink-0" /> 
                            <span>Timeline: <span className="text-slate-900 dark:text-slate-200 font-bold">{project.displayStart}</span> → <span className="text-slate-900 dark:text-slate-200 font-bold">{project.displayEnd}</span></span>
                          </p>
                          
                          <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
                            <ShieldCheck size={11} className="text-emerald-500 dark:text-slate-500 shrink-0" />
                            <span>Duration Days: <span className="text-slate-900 dark:text-white font-mono font-black">{project.durationDays} Active Days</span></span>
                          </p>
                          
                          <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-500">
                            <span>Workflow Phase:</span>
                            <span className="text-slate-700 dark:text-slate-300 font-black px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">{project.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-16 text-center border-b border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center w-full bg-white dark:bg-slate-900 flex-1">
                <AlertTriangle size={18} className="text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 ">No active timeline records.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control pagination strip */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-slate-800/40 shrink-0 w-full select-none z-10">
        <span className="text-xs font-semibold text-slate-500">
          Showing {validProjects.length ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, validProjects.length)} of {validProjects.length} entries
        </span>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className={`p-2 rounded-xl border transition-all active:scale-95 ${
              currentPage === 1
                ? "opacity-40 cursor-not-allowed border-gray-200 dark:border-slate-800 text-gray-400"
                : "cursor-pointer border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
            }`}
          >
            <ChevronLeft size={16} />
          </button>
          
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className={`p-2 rounded-xl border transition-all active:scale-95 ${
              currentPage === totalPages
                ? "opacity-40 cursor-not-allowed border-gray-200 dark:border-slate-800 text-gray-400"
                : "cursor-pointer border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectTimeline;