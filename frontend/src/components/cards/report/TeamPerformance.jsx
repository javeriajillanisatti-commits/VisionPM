import React from 'react';

const TeamPerformance = ({ team = [] }) => {
   return (
    // Table container handles automatic dark background switching with custom gray borders
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto overflow-y-auto max-h-[500px] p-4 md:p-6 custom-scrollbar">
        <table className="w-full text-left min-w-[900px] border-separate border-spacing-0 table-fixed">
          
          {/* Table headers configured with absolute background color anchors */}
          <thead className="text-[14px] font-semibold text-gray-600 dark:text-slate-400  sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 z-10">
            <tr>
              <th className="pb-4 w-[280px] border-b border-gray-100 dark:border-slate-800">Team Member</th>
              <th className="pb-4 text-center w-32 border-b border-gray-100 dark:border-slate-800">Assigned Tasks</th>
              <th className="pb-4 text-center w-28 border-b border-gray-100 dark:border-slate-800">Completed</th>
              <th className="pb-4 w-44 px-4 text-center border-b border-gray-100 dark:border-slate-800">Workload</th>
              <th className="pb-4 text-center w-36 border-b border-gray-100 dark:border-slate-800">Availability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
            {team.length > 0 ? (
              team.map((m, i) => {
                const workloadNum = m.workload || 0;
                const availability = m.availability || "Available";

                // Synced Workload Progress Bars Color Mapping
                const getAvailabilityBarColor = (value) => {
                  if (value === "Available") return "bg-cyan-500";
                  if (value === "Busy") return "bg-purple-500";
                  if (value === "At Capacity") return "bg-orange-500";
                  if (value === "Overloaded") return "bg-red-700";
                  return "bg-cyan-500";
                };

                // Synced Availability Badges Color Mapping
                const getAvailabilityStatusColor = (value) => {
                  if (value === "Available") return "text-cyan-500 border-cyan-500";
                  if (value === "Busy") return "text-purple-500 border-purple-500";
                  if (value === "At Capacity") return "text-orange-500 border-orange-500";
                  if (value === "Overloaded") return "text-red-700 border-red-700";
                  return "text-cyan-500 border-cyan-500";
                };

                return (
                  <tr key={i} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/30 transition-colors group text-sm">
                    
                    {/* Member Profile Block */}
                    <td className="py-4 pr-4 max-w-[280px]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-700 flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
                          {m.initial || m.name?.split(' ').map(n => n[0]).join('') || "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-slate-200 text-sm truncate" title={m.name}>
                            {m.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Numerical Metrics Indicators */}
                    <td className="py-4 text-center font-medium text-gray-700 dark:text-slate-300">{m.tasks || 0}</td>
                    <td className="py-4 text-center font-medium text-emerald-600 dark:text-emerald-400">{m.completed || 0}</td>

                    {/* Standard Workload Linear Slide Track */}
                    <td className="py-4 px-4">
                      <div className="w-full max-w-[130px] mx-auto text-center">
                        <span className="text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1 block">
                          {workloadNum}%
                        </span>
                        <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${getAvailabilityBarColor(availability)}`} 
                            style={{ width: `${Math.min(workloadNum, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Structural Badge Cells matching adaptive filters */}
                    <td className="py-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded text-[12px] font-bold border ${getAvailabilityStatusColor(availability)}`}
                      >
                        {availability}
                      </span>
                    </td>

                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="py-16 text-center text-gray-400 dark:text-slate-500 font-medium">
                  No team performance metrics found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamPerformance;
