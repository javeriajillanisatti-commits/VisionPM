import React from "react";
import { AlertTriangle, Clock3, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const QuickStat = ({ label, value, isDarkMode }) => (
  <div
    className={`min-w-0 max-w-full rounded-2xl border p-3 sm:p-4 transition-colors duration-200 overflow-hidden ${
      isDarkMode
        ? "bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
        : "bg-white border-gray-200 hover:bg-gray-100"
    }`}
  >
   <p className={`text-xs sm:text-sm font-medium tracking-wide break-words ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
  {label}
</p>
<p className={`text-xl sm:text-2xl font-semibold mt-1.5 tracking-tight whitespace-nowrap ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
  {value}
</p> 
  </div>
);

const ActivityList = ({ activities, showActivities, isDarkMode }) => {
  if (!activities?.length)
    return (
      <div className={`rounded-2xl border p-5 sm:p-6 text-center min-w-0 ${isDarkMode ? "bg-white/[0.02] border-white/10" : "bg-white border-gray-200"}`}>
        <p className={`text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          No recent activity found
        </p>
        <p className={`text-[11px] mt-0.5 break-words ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
          User actions will appear here automatically
        </p>
      </div>
    );

  return (
    <div className="space-y-2 min-w-0">
      {(showActivities ? activities : activities.slice(0, 5)).map((activity, index) => (
        <div
          key={activity._id || index}
          className={`flex gap-2.5 sm:gap-3 p-3 rounded-xl border transition-colors duration-200 min-w-0 max-w-full ${
            isDarkMode
              ? "bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
              : "bg-white border-gray-200 hover:bg-gray-100"
          }`}
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isDarkMode ? "bg-white/5 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
            <Clock3 size={13} />
          </div>

          <div className="min-w-0 flex-1 max-w-full">
            <p className={`text-xs font-medium break-words ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
              {activity.description || `${activity.action || "Activity"} ${activity.module || ""}`}
            </p>

            {activity.targetName && (
              <p className={`text-[11px] mt-0.5 break-words ${isDarkMode ? "text-gray-400 font-light" : "text-gray-500"}`}>
                {activity.targetName}
              </p>
            )}

            {activity.createdAt && (
              <p className={`text-[10px] mt-1 break-words ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                {new Date(activity.createdAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const UserQuickViewDrawer = ({
  selectedUser,
  quickViewData,
  quickViewLoading,
  quickViewError,
  recentActivities,
  showActivities,
  setShowActivities,
  onClose,
}) => {
  const { isDarkMode } = useTheme();

  if (!selectedUser) return null;

  const isManager = selectedUser.role === "Project Manager";
  const stats = isManager
    ? [
        ["Projects Created", quickViewData?.data.projects.total],
        ["Tasks", quickViewData?.data.tasks.total],
        ["Team Size", quickViewData?.data.team.total],
      ]
    : [
        ["Assigned Tasks", quickViewData?.data.assignedTasks.total],
        ["Completed", quickViewData?.data.completed],
        ["Pending", quickViewData?.data.pending],
      ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close user drawer"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <aside
        className={`relative w-full min-[430px]:w-[420px] sm:w-[460px] max-w-full h-full overflow-y-auto overflow-x-hidden shadow-2xl border-l backdrop-blur-2xl transition-transform duration-300 ease-out ${
          isDarkMode
            ? "bg-[#060b1d]/95 border-white/10 text-gray-100"
            : "bg-white/95 border-gray-200/80 text-gray-900"
        }`}
      >
        {/* Drawer header */}
        <div className={`sticky top-0 z-10 px-4 min-[430px]:px-5 sm:px-6 py-4 sm:py-5 border-b backdrop-blur-xl ${isDarkMode ? "bg-[#060b1d]/90 border-white/10" : "bg-white/90 border-gray-100"}`}>
          <div className={`absolute top-0 left-0 right-0 h-1 ${isManager ? "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-sm shadow-indigo-500/50" : "bg-gradient-to-r from-blue-500 to-indigo-500 shadow-sm shadow-blue-500/50"}`} />

          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 shrink-0">
                <div className={`w-full h-full rounded-full flex items-center justify-center text-base font-bold ${isDarkMode ? "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30" : "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/60"} ${selectedUser.isOnline ? "ring-2 ring-emerald-400/70" : ""}`}>
                  {selectedUser.fullName?.charAt(0)?.toUpperCase()}
                </div>

                {selectedUser.isOnline && (
                  <>
                    <span className="absolute inset-0 rounded-full ring-2 ring-emerald-400 animate-ping opacity-60" />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 shadow-sm shadow-emerald-400/50 ${isDarkMode ? "border-[#060b1d]" : "border-white"}`} />
                  </>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className={`text-sm sm:text-base font-bold tracking-tight truncate ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                  {selectedUser.fullName}
                </h2>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap min-w-0">
                  <span className={`text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-full shadow-2xs max-w-full break-words ${isDarkMode ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/20" : "bg-indigo-50 text-indigo-600 border border-indigo-100"}`}>
                    {selectedUser.role || "Team Member"}
                  </span>

                  <span className="text-gray-400 shrink-0">•</span>

                  <span className={`text-[10px] sm:text-[11px] font-medium flex items-center gap-1.5 shrink-0 ${selectedUser.isOnline ? "text-emerald-400" : isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedUser.isOnline ? "bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400" : "bg-gray-400"}`} />
                    {selectedUser.isOnline ? "Active now" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${isDarkMode ? "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white" : "bg-gray-100/80 hover:bg-gray-200 text-gray-600 hover:text-gray-900"}`}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-4 min-[430px]:p-5 sm:p-6 min-w-0">
          {quickViewLoading ? (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className={`h-24 sm:h-28 rounded-2xl animate-pulse min-w-0 ${isDarkMode ? "bg-white/5 border border-white/5" : "bg-gray-100 border border-gray-200/50"}`}
                />
              ))}
            </div>
          ) : quickViewError ? (
            <div className={`rounded-2xl border p-4 sm:p-5 text-center min-w-0 ${isDarkMode ? "bg-red-950/20 border-red-500/20 text-red-300" : "bg-red-50/80 border-red-200 text-red-600"}`}>
              <AlertTriangle size={20} className="mx-auto mb-2 text-red-500" />
              <p className="text-xs font-medium break-words">{quickViewError}</p>
            </div>
          ) : quickViewData ? (
            <>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 min-w-0">
                {stats.map(([label, value]) => (
                  <QuickStat key={label} label={label} value={value} isDarkMode={isDarkMode} />
                ))}
                <QuickStat label="Activities" value={recentActivities.length} isDarkMode={isDarkMode} />
              </div>

              <div className="mt-5 sm:mt-6 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-3.5 min-w-0">
                  <div className="min-w-0 flex-1">
                     <h3 className={`text-base sm:text-lg font-bold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                      Recent Activity
                    </h3>
                    <p className={`text-[10px] sm:text-[11px] mt-0.5 leading-relaxed break-words ${isDarkMode ? "text-gray-400 font-light" : "text-gray-500"}`}>
                      Latest actions performed by this user
                    </p>
                  </div>

                  {recentActivities.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setShowActivities(value => !value)}
                      className={`text-[10px] sm:text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all shrink-0 whitespace-nowrap ${isDarkMode ? "bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/20" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100"}`}
                    >
                      {showActivities ? "Show Less" : "View All"}
                    </button>
                  )}
                </div>

                <ActivityList
                  activities={recentActivities}
                  showActivities={showActivities}
                  isDarkMode={isDarkMode}
                />
              </div>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
};

export default UserQuickViewDrawer;