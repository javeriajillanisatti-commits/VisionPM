import React from "react";
import { Mail, FolderKanban } from "lucide-react";

const MembersTable = ({ filteredMembers, getInitials }) => {
  const hasMembers = filteredMembers.length > 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden mt-4 transition-colors duration-200">
      <div className="w-full overflow-x-auto scrollbar-none">
        <table className="w-full min-w-[900px] text-left border-collapse table-auto">
          <thead className="bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 text-[12px] sm:text-[13px] font-bold text-gray-600 dark:text-slate-400 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-4 sm:px-6 sm:pl-8 whitespace-nowrap">Member Info</th>
              <th className="py-3 px-4 whitespace-nowrap">Role</th>
              <th className="py-3 px-4 max-w-sm whitespace-nowrap">Assigned Projects</th>
              <th className="py-3 px-4 text-center w-44 whitespace-nowrap">Workload</th>
              <th className="py-3 px-4 text-center w-36 whitespace-nowrap">Availability</th>
              <th className="py-3 px-4 sm:px-6 text-center sm:pr-8 w-40 whitespace-nowrap">Joining Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
            {hasMembers ? (
              filteredMembers.map((member) => {
                const memberId = member._id || member.id;
                const memberName = member.fullName || member.name || "Team Member";
                const assignedProjects = member.projects || [];
                const workloadNum = member.workload || 0;
                const availability = member.availability || "Available";

                const getAvailabilityBarColor = (value) => {
                  if (value === "Available") return "bg-cyan-500";
                  if (value === "Busy") return "bg-purple-500";
                  if (value === "At Capacity") return "bg-orange-500";
                  if (value === "Overloaded") return "bg-red-700";
                  return "bg-cyan-500";
                };

                const getAvailabilityStatusColor = (value) => {
                  if (value === "Available") return "text-cyan-500 border-cyan-500";
                  if (value === "Busy") return "text-purple-500 border-purple-500";
                  if (value === "At Capacity") return "text-orange-500 border-orange-500";
                  if (value === "Overloaded") return "text-red-700 border-red-700";
                  return "text-cyan-500 border-cyan-500";
                };

                return (
                  <tr
                    key={memberId}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors text-sm"
                  >
                    <td className="py-4 px-4 sm:px-6 sm:pl-8 max-w-[280px]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0 bg-indigo-600 tracking-wider">
                          {getInitials(memberName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            className="font-semibold text-gray-900 dark:text-slate-200 truncate text-sm"
                            title={memberName}
                          >
                            {memberName}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-slate-400 font-medium flex items-center gap-1.5 truncate mt-0.5">
                            <Mail size={12} className="text-gray-400 dark:text-slate-500 shrink-0" />
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded border bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700">
                        {member.role || "Team Member"}
                      </span>
                    </td>

                    <td className="py-4 px-4 max-w-sm">
                      <div className="flex flex-wrap gap-1.5 max-h-[46px] overflow-y-auto pr-1 content-start">
                        {assignedProjects.length > 0 ? (
                          assignedProjects.map((p, idx) => (
                            <span
                              key={p._id || p.id || idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-medium text-gray-600 dark:text-slate-300 rounded max-w-[140px] truncate"
                              title={p.projectName || p.name}
                            >
                              <FolderKanban size={11} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
                              <span className="truncate">{p.projectName || p.name}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-slate-500 font-medium italic">
                            No projects assigned
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {/* Fixed Layout: Text percentage is rendered on top of progress track element */}
                      <div className="flex flex-col items-center justify-center w-full max-w-[140px] mx-auto space-y-1">
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-300 tracking-wide block">
                          {workloadNum}%
                        </span>
                        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${getAvailabilityBarColor(availability)}`}
                            style={{ width: `${Math.min(workloadNum, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-[12px] font-bold border ${getAvailabilityStatusColor(availability)}`}
                      >
                        {availability}
                      </span>
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-center sm:pr-8 text-gray-500 dark:text-slate-400 font-medium text-xs whitespace-nowrap">
                      {member.joinedDate
                        ? new Date(member.joinedDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="py-16 px-6 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 flex items-center justify-center mb-3 text-indigo-500">
                      <FolderKanban size={17} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300">
                      No Team Members Found
                    </h3>
                    <p className="text-[11px] font-medium text-gray-400 dark:text-slate-500 mt-1">
                      No members match the selected filter or search.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MembersTable;
