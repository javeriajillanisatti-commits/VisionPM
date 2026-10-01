import React, { useState } from "react";
import { BriefcaseBusiness, Calendar, BarChart2, Layers } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";

const PMProjectPipeline = ({ projects = [], onNavigateToProject }) => {
  const [activeTab, setActiveTab] = useState("All");
  const { isDarkMode } = useTheme();

  const parseSafeDate = (dateVal) => {
    if (!dateVal) return "N/A";
    const date = new Date(dateVal);
    return isNaN(date.getTime()) ? dateVal.toString().substring(0, 10) : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const getStatus = (project) => (project.status || "Planning").toString().trim().toLowerCase();

  const tabs = [
    { id: "All", label: "All", icon: <Layers size={13} /> },
    { id: "Planning", label: "Planning", icon: <Calendar size={13} className="text-blue-500" /> },
    { id: "In Progress", label: "In Progress", icon: <BarChart2 size={13} className="text-amber-500" /> },
    { id: "On Hold", label: "On Hold", icon: <BriefcaseBusiness size={13} className="text-gray-500" /> },
    { id: "Completed", label: "Completed", icon: <Layers size={13} className="text-emerald-500" /> },
    { id: "Cancelled", label: "Cancelled", icon: <Layers size={13} className="text-rose-500" /> },
  ];

  const filteredProjects = projects.filter((project) => activeTab === "All" || getStatus(project) === activeTab.toLowerCase());
  const getTabCount = (id) => id === "All" ? projects.length : projects.filter((project) => getStatus(project) === id.toLowerCase()).length;

  return (
    <div className={`h-[520px] w-full p-4 sm:p-6 lg:p-8 rounded-[2rem] border shadow-sm transition-all duration-500 flex flex-col justify-between overflow-hidden ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-200"}`}>
      <div className="flex flex-col gap-1 mb-4 shrink-0">
        <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-800"}`}>Workspace Project List</h3>
        <p className={`text-[12px] font-medium mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Live tracking summary of current work phases.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0 border-b border-gray-100 dark:border-slate-800/40 pb-4 w-full">
        <div className="flex gap-1.5 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-1 shadow-sm w-full sm:w-fit overflow-x-auto scrollbar-none shrink-0 h-fit">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer ${isActive ? "bg-blue-600 text-white border-blue-600" : "text-gray-500 dark:text-slate-400"}`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${isActive ? "bg-white/20 text-white" : isDarkMode ? "bg-slate-800 text-slate-400 border border-slate-700/50" : "bg-gray-200 text-gray-600"}`}>
                  {getTabCount(tab.id)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full overflow-x-auto scrollbar-none">
        <div className="min-w-[750px] h-full flex flex-col justify-between">
          <table className="w-full text-left border-separate border-spacing-0 shrink-0">
            <thead>
              <tr className={`text-[13px] font-black ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}>
                {["Project Name", "Progress", "Status", "Creation Date"].map((label, i) => (
                  <th key={label} className={`pb-3 border-b ${isDarkMode ? "border-[#263149]" : "border-gray-100"} ${i === 0 ? "w-[35%] pl-2" : i === 1 ? "w-[35%] pl-4" : i === 2 ? "w-[15%] pl-2" : "w-[15%] pl-0"}`}>{label}</th>
                ))}
              </tr>
            </thead>
          </table>
          <div className={`flex-1 min-h-0 overflow-y-auto pr-1 mt-1 scrollbar-thin ${isDarkMode ? "scrollbar-thumb-slate-800" : "scrollbar-thumb-slate-200"}`}>
            <table className="w-full text-left border-separate border-spacing-0">
              <tbody className={`divide-y ${isDarkMode ? "divide-slate-800/60" : "divide-gray-100"}`}>
                {filteredProjects.length ? filteredProjects.map((p, i) => {
                  const progress = p.progress || 0;
                  const status = getStatus(p);
                  let progressBarColor = "bg-blue-500";
                  if (status === "in progress") progressBarColor = "bg-amber-500";
                  else if (status === "on hold") progressBarColor = "bg-gray-500";
                  else if (status === "completed") progressBarColor = "bg-emerald-500";
                  else if (status === "cancelled" || status === "cancel") progressBarColor = "bg-rose-500";

                  return (
                    <tr key={p._id || p.id || i} onClick={() => onNavigateToProject?.(p)} className={`text-xs cursor-pointer ${isDarkMode ? "hover:bg-[#151F32]" : "hover:bg-slate-50/60"}`}>
                      <td className="py-4 w-[35%] pl-2 relative">
                        <div className="relative group inline-block max-w-full">
                          <span className={`font-bold text-sm truncate block ${isDarkMode ? "text-gray-200 group-hover:text-blue-400" : "text-gray-800 group-hover:text-blue-600"}`}>{p.projectName || p.title}</span>
                          <div className={`absolute left-0 hidden group-hover:block z-[99] p-4 rounded-2xl border shadow-2xl space-y-1.5 text-[12px] font-semibold min-w-[150px] pointer-events-none ${i <= 1 ? "top-full mt-1" : "bottom-full mb-1"} ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-gray-100 text-slate-600"}`}>
                            <p className="text-[11px] font-medium tracking-wide text-gray-400 dark:text-slate-500 mb-1">Task Breakdown</p>
                            <div className="space-y-1">
                              <p className="flex justify-between gap-6"><span>To Do:</span><span className="text-blue-800 dark:text-blue-400 font-bold">{p.todo ?? 0}</span></p>
                              <p className="flex justify-between gap-6"><span>In Progress:</span><span className="text-amber-600 dark:text-amber-500 font-bold">{p.inProgress ?? 0}</span></p>
                              <p className="flex justify-between gap-6"><span>Completed:</span><span className="text-emerald-600 dark:text-emerald-400 font-bold">{p.completed ?? 0}</span></p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 w-[35%] pl-4 pr-4">
                        <div className="flex items-center gap-3 justify-start max-w-[190px]">
                          <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}><div className={`h-full rounded-full ${progressBarColor}`} style={{ width: `${progress}%` }} /></div>
                          <span className={`text-[11px] font-black w-8 text-left ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{progress}%</span>
                        </div>
                      </td>
                      <td className="py-4 w-[15%] pl-2 text-left">
                        <span className={`px-2.5 py-1 rounded-lg text-[12px] font-bold border inline-block ${status === "in progress" ? "text-amber-500 border-amber-100" : status === "planning" ? "text-blue-500 border-blue-100" : status === "on hold" ? "text-gray-500 border-gray-100" : status === "completed" ? "text-emerald-500 border-emerald-100" : "text-rose-500 border-rose-100"}`}>{p.status || "Planning"}</span>
                      </td>
                      <td className={`py-4 w-[15%] pl-2 text-left font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{parseSafeDate(p.createdAt || p.startDate)}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={4} className="py-20 text-center"><div className="flex flex-col items-center justify-center max-w-xs mx-auto"><div className={`w-10 h-11 rounded-xl mb-3 flex items-center justify-center border shadow-sm ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-gray-100"}`}><BriefcaseBusiness size={16} className={isDarkMode ? "text-slate-600" : "text-gray-300"} /></div><h4 className={`text-xs font-black uppercase tracking-tight ${isDarkMode ? "text-slate-400" : "text-slate-700"}`}>No Project Records</h4><p className={`text-[10px] font-medium mt-1 leading-normal ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}>There are currently no workspace active projects matching the selected status filter option.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PMProjectPipeline;
