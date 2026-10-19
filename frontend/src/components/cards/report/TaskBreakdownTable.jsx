import React from 'react';
import { useTheme } from "../../../context/ThemeContext";
import { Calendar } from "lucide-react";

const TaskBreakdownTable = ({ tasks = [] }) => {
  const { isDarkMode } = useTheme();
  const tasksWithProjects = tasks.map(task => ({ ...task, projectName: task.project?.projectName || "General" }));
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed':
        return isDarkMode ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-600 border-green-100';
      case 'In Progress': return isDarkMode ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Todo': default: return isDarkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className={`p-8 text-center rounded-2xl border ${isDarkMode ? "bg-[#11182B] border-[#263149] text-gray-400" : "bg-white border-gray-100 text-gray-500"}`} >
        No tasks found for the selected filters.
      </div>);
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-start mb-2">
        <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`} >
          Total Assigned: {tasks.length}
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Table Column Headers */}
          <div className={`grid grid-cols-4 items-center px-6 py-3 rounded-2xl border text-[14px] font-bold tracking-wider ${isDarkMode ? "bg-[#11182B]/60 border-[#263149] text-gray-600" : "bg-gray-100/70 border-gray-200 text-gray-500"}`} >
            <div>Project</div>
            <div>Task</div>
            <div className="text-center">Status</div>
            <div className="text-right">Deadline</div>
          </div>

          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2 mt-2"> {tasksWithProjects.map((t) => {
            const currentId = t._id || t.id;
            const taskTitle = t.taskTitle || t.title || "Untitled Task";
            const projectName = t.projectName;
            const status = t.status === "Todo" ? "To Do" : t.status;
            const deadline = t.deadline ? t.deadline.substring(0, 10) : "N/A";
            return (
              <div key={currentId} className={`grid grid-cols-4 items-center px-6 py-4 rounded-2xl border transition-all duration-200 hover:shadow-md cursor-pointer ${isDarkMode ? "bg-[#11182B] border-[#263149] hover:bg-[#18223A] text-white" : "bg-gray-50 border-gray-200/60 hover:bg-gray-100/80 text-gray-900 shadow-sm"}`}>
                {/*  Project Name */}
                <div className="truncate pr-2 min-w-0">
                  <span className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`} >
                    {projectName}
                  </span>
                </div>
                {/* Task Title */}
                <div className="pr-2 overflow-hidden min-w-0">
                  <h4 className="text-sm font-normal truncate"> {taskTitle} </h4>
                </div>

                {/*Status Badge */}
                <div className="flex justify-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(t.status)}`}>{status}</span>
                </div>
                {/* Deadline */}
                <div className="flex items-center justify-end gap-2">
                  <Calendar size={15} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
                  <span className={`text-xs font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {deadline}
                  </span>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskBreakdownTable;