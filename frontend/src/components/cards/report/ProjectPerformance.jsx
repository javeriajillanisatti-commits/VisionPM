import React from 'react';

const ProjectPerformance = ({ projects = [] }) => {
  
  // Dynamic status badge color layout strings mapping 
  const getStatusBadgeStyle = value => {
    const s = value?.toString().toLowerCase() || "planning";
    
    if (s.includes("progress") || s === "in progress") return "text-amber-500 border border-amber-500 bg-transparent";
    if (s.includes("complete") || s === "completed") return "text-emerald-500 border border-emerald-500 bg-transparent";
    if (s.includes("hold") || s === "on hold") return "text-gray-500 border border-gray-500 bg-transparent"; 
    if (s.includes("plan") || s === "planning" || s.includes("todo") || s === "to do") return "text-blue-500 border border-blue-500 bg-transparent"; 
    if (s.includes("cancel") || s === "cancelled") return "text-rose-500 border border-rose-500 bg-transparent";
    
    return "text-blue-500 border border-blue-500 bg-transparent";
  };

  // Status mapping functions tracking for solid blue or specific status colors
  const getProgressBarColor = value => {
    const s = value?.toString().toLowerCase() || "planning";
    if (s.includes("progress") || s === "in progress") return "bg-amber-500";
    if (s.includes("complete") || s === "completed") return "bg-emerald-500";
    if (s.includes("hold") || s === "on hold") return "bg-gray-500";
    if (s.includes("plan") || s === "planning" || s.includes("todo") || s === "to do") return "bg-blue-500";
    if (s.includes("cancel") || s === "cancelled") return "bg-rose-500";
    return "bg-blue-500";
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto overflow-y-auto max-h-[500px] p-4 md:p-6 custom-scrollbar">
        <table className="w-full text-left min-w-[1100px] border-separate border-spacing-0 table-fixed">
          
          <thead className="text-[14px] font-semibold text-gray-600 dark:text-slate-400 sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 z-10">
            <tr>
              <th className="pb-4 w-[320px] border-b border-gray-100 dark:border-slate-800 pl-2">Project Name</th>
              <th className="pb-4 text-center w-24 border-b border-gray-100 dark:border-slate-800">Total Tasks</th>
              {/* Columns labels color variables synchronized down here */}
              <th className="pb-4 text-center w-20 text-blue-500 dark:text-blue-400 border-b border-gray-100 dark:border-slate-800">To Do</th>
              <th className="pb-4 text-center w-28 text-amber-500 dark:text-amber-400 border-b border-gray-100 dark:border-slate-800">In Progress</th>
              <th className="pb-4 text-center w-24 text-emerald-500 dark:text-emerald-400 border-b border-gray-100 dark:border-slate-800">Completed</th>
              <th className="pb-4 w-40 px-4 text-center border-b border-gray-100 dark:border-slate-800">Progress</th>
              <th className="pb-4 text-center w-32 border-b border-gray-100 dark:border-slate-800">Status</th>
              <th className="pb-4 text-right w-44 border-b border-gray-100 dark:border-slate-800 pr-4">Timeline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
            {projects.length > 0 ? projects.map((p, i) => (
              <tr key={i} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/30 transition-colors group text-sm">
                
                <td className="py-4 pr-4 max-w-[320px] pl-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-slate-200 text-sm truncate" title={p.name}>
                      {p.name}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 font-normal truncate mt-0.5" title={p.desc}>
                      {p.desc || "No description provided."}
                    </p>
                  </div>
                </td>

                <td className="py-4 text-center font-medium text-gray-700 dark:text-slate-300">{p.total || 0}</td>
                {/* Specific 500 weights text elements mapped without background weights padding */}
                <td className="py-4 text-center font-bold text-blue-500 dark:text-blue-400">{p.todo || 0}</td>
                <td className="py-4 text-center font-bold text-amber-500 dark:text-amber-400">{p.ip || 0}</td>
                <td className="py-4 text-center font-bold text-emerald-500 dark:text-emerald-400">{p.done || 0}</td>

                <td className="py-4 px-4">
                  <div className="w-full max-w-[120px] mx-auto">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-1 block text-center">
                      {p.progress || 0}%
                    </span>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${getProgressBarColor(p.status)}`}
                        style={{ width: `${Math.min(p.progress || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>

                <td className="py-4 text-center">
                  <span className={`px-2 py-0.5 rounded text-[12px] font-bold ${getStatusBadgeStyle(p.status)}`}>
                    {p.status || "Planning"}
                  </span>
                </td>

                <td className="py-4 text-right text-[11px] font-medium text-gray-500 dark:text-slate-400 pr-4 whitespace-nowrap">
                  {p.timeline || "N/A"}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="8" className="py-16 text-center text-gray-400 dark:text-slate-500 font-medium">
                  No projects records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectPerformance;
