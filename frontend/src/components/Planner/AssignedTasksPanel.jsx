import React from "react";
import { ListTodo, CalendarPlus, ChevronRight,  } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const priorityStyles = {
  High: { badge: "bg-[#D96B6B]/10 text-[#D96B6B] border-[#D96B6B]/20", badgeDark: "bg-[#D96B6B]/10 text-[#D96B6B] border-[#D96B6B]/20", dot: "bg-[#D96B6B]" },
  Medium: { badge: "bg-[#D6A832]/10 text-[#D6A832] border-[#D6A832]/20", badgeDark: "bg-[#D6A832]/10 text-[#D6A832] border-[#D6A832]/20", dot: "bg-[#D6A832]" },
  Low: { badge: "bg-[#5FAF68]/10 text-[#5FAF68] border-[#5FAF68]/20", badgeDark: "bg-[#5FAF68]/10 text-[#5FAF68] border-[#5FAF68]/20", dot: "bg-[#5FAF68]" },
};

const AssignedTasksPanel = ({ unplannedTasks, onScheduleClick }) => {
  const { isDarkMode: dark } = useTheme();
  
  const border = dark ? "border-[#263149]" : "border-gray-100";
  const title = dark ? "text-white" : "text-gray-800";
  const muted = dark ? "text-gray-500" : "text-gray-400";

  return (
    <div className={`w-full h-full min-h-0 rounded-2xl shadow-sm overflow-hidden border transition-colors duration-300 ${dark ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-100"}`}>
      {/* Header */}
      <div className={`px-3 sm:px-5 py-4 border-b shrink-0 ${border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${dark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
              <ListTodo size={20} />
            </div>
            <div>
              <h3 className={`text-sm font-black ${title}`}>My Tasks</h3>
              <p className={`text-[11px] mt-0.5 ${muted}`}>Tasks waiting to be planned</p>
            </div>
          </div>

          {unplannedTasks.length > 0 && (
            <span className={`min-w-7 h-7 px-2 rounded-full flex items-center justify-center text-xs font-black ${dark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
              {unplannedTasks.length}
            </span>
          )}
        </div>
     </div>

      {/* Task list */}
      <div className="p-3 sm:p-4 min-h-0">
        {!unplannedTasks.length ? (
          <div className="py-8 text-center">
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${dark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-500"}`}>✓</div>
            <p className={`text-sm font-bold ${dark ? "text-gray-200" : "text-gray-700"}`}>You're all planned!</p>
             
          </div>
        ) : (
          <div className="max-h-[420px] sm:max-h-[500px] lg:max-h-[600px] overflow-y-auto overflow-x-hidden pr-1 sm:pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {unplannedTasks.map(task => {
              const priority = task.priority || "Medium";
              const style = priorityStyles[priority] || priorityStyles.Medium;

              return (
                <div key={task._id} className={`group rounded-xl p-4 border transition-all ${dark ? "border-[#263149] hover:border-blue-500/30 hover:bg-blue-500/[0.04]" : "border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm"}`}>
                  {/* Task information */}
                  <div className="flex items-start gap-3">
                   

                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold leading-5 break-words ${dark ? "text-gray-100" : "text-gray-800"}`}>
                        {task.taskTitle || task.title || "Untitled Task"}
                      </p>
                      <p className={`text-[9px] mt-1 ${dark ? "text-gray-600" : "text-gray-400"}`}>Schedule Task</p>
                    </div>

                    <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${dark ? style.badgeDark : style.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {priority}
                    </span>
                  </div>

                  {/* Schedule action */}
                  <button
                    type="button"
                    onClick={() => onScheduleClick(task)}
                    className={`mt-4 w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${dark ? "bg-white/5 text-gray-300 hover:bg-blue-600 hover:text-white" : "bg-gray-50 text-gray-600 hover:bg-blue-600 hover:text-white"}`}
                  >
                    <span className="flex items-center gap-2"><CalendarPlus size={15} />Schedule this task</span>
                    <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedTasksPanel;