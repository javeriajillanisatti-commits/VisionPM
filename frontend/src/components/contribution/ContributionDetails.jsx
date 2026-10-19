import React, { useState } from "react";
import { X, Paperclip, MessageCircle, UserRound, CalendarDays, ExternalLink } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const statusStyles = {
  Todo: ["bg-blue-50 text-blue-600 border-blue-100", "bg-blue-500/10 text-blue-400 border-blue-500/20"],
  "In Progress": ["bg-amber-50 text-amber-600 border-amber-100", "bg-amber-500/10 text-amber-400 border-amber-500/20"],
  Completed: ["bg-green-50 text-green-600 border-green-100", "bg-green-500/10 text-green-400 border-green-500/20"],
};

const priorityStyles = {
  High: ["#f43f5e", "bg-rose-50 text-rose-600 border-rose-100", "bg-rose-500/10 text-rose-400 border-rose-500/20"],
  Medium: ["#f59e0b", "bg-amber-50 text-amber-600 border-amber-100", "bg-amber-500/10 text-amber-400 border-amber-500/20"],
  Low: ["#3b82f6", "bg-blue-50 text-blue-600 border-blue-100", "bg-blue-500/10 text-blue-400 border-blue-500/20"],
};
// Render task contribution details
const ContributionDetails = ({ task, onClose, onViewDetails }) => {
   
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { isDarkMode } = useTheme();

  if (!task) return null;

  const status = task.status || "Todo";
  const priority = task.priority || "Medium";
  const taskTitle = task.taskTitle || task.title || "Untitled Task";

const description = task.description?.trim() || "No description provided.";

const assignees = Array.isArray(task.assignees)
  ? task.assignees
  : [];

const assigneeName = assignees.length
  ? assignees.map((member) => member.fullName).filter(Boolean).join(", ")
  : "No assignee";

const dueDate = task.deadline
  ? new Date(task.deadline).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  : "No due date";
  const border = isDarkMode ? "border-[#263149]" : "border-slate-100";
  const label = isDarkMode ? "text-slate-400" : "text-slate-500";
  const value = isDarkMode ? "text-slate-200" : "text-slate-700";
  const [priorityColor] = priorityStyles[priority] || priorityStyles.Medium;

  return (
    <div className={`w-full h-auto min-h-[420px] min-[600px]:min-h-[500px] lg:h-[600px] rounded-3xl border shadow-sm overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-slate-200"}`}>
      <div className="h-full flex flex-col p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="min-w-0 pr-4">
            <p className={`text-[10px] font-black uppercase tracking-wider mb-2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Selected Task</p>
            <h3 className={`text-lg font-black leading-6 break-words ${isDarkMode ? "text-white" : "text-slate-800"}`}>{taskTitle}</h3>
          </div>
          <button onClick={onClose} className={`shrink-0 p-1.5 rounded-lg transition-colors ${isDarkMode ? "text-slate-500 hover:text-slate-300 hover:bg-white/5" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}>
            <X size={18} />
          </button>
        </div>

        {/* Quick metadata */}
        <div>
          {[
            ["Status", <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${isDarkMode ? (statusStyles[status] || statusStyles.Todo)[1] : (statusStyles[status] || statusStyles.Todo)[0]}`}>{status}</span>],
            ["Priority", <span className="flex items-center gap-2"><i className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityColor }} /><b className={`text-sm ${value}`}>{priority}</b></span>],
            [<><Paperclip size={15} /> Files</>, <b className={`text-sm ${value}`}>{task.filesCount || 0}</b>],
            [<><MessageCircle size={15} /> Comments</>, <b className={`text-sm ${value}`}>{task.commentsCount || 0}</b>],
          ].map(([labelText, content], i) => (
            <div key={i} className={`flex items-center justify-between py-3 border-b ${border}`}>
              <span className={`flex items-center gap-2 text-sm ${label}`}>{labelText}</span>{content}
            </div>
          ))}
        </div>

        {/* Description */}
       
<div className="mt-5">
  <p
    className={`text-[10px] font-black uppercase tracking-wider mb-2 ${
      isDarkMode ? "text-slate-500" : "text-slate-400"
    }`}
  >
    Description
  </p>

  <div
    className={`rounded-xl border p-4 ${
      isDarkMode
        ? "bg-[#0d1428] border-[#263149]"
        : "bg-slate-50 border-slate-100"
    }`}
  >
    <p
      className={`text-sm leading-6 whitespace-pre-wrap break-words ${
        isDarkMode ? "text-slate-300" : "text-slate-600"
      } ${
        !showFullDescription ? "line-clamp-3" : ""
      }`}
    >
      {description}
    </p>

    {description.length > 180 && (
      <button
        type="button"
        onClick={() => setShowFullDescription((prev) => !prev)}
        className={`mt-2 text-xs font-bold transition-colors ${
          isDarkMode
            ? "text-blue-400 hover:text-blue-300"
            : "text-blue-600 hover:text-blue-700"
        }`}
      >
        {showFullDescription ? "Show Less" : "Show More"}
      </button>
    )}
  </div>
</div>
        {/* Assignee and due date */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[
            ["Assigned To", <UserRound size={15} />, assigneeName],
            ["Due Date", <CalendarDays size={15} />, dueDate],
          ].map(([title, icon, text], i) => (
            <div key={title} className={`rounded-xl border p-3 ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-slate-100"}`}>
              <p className={`text-[10px] font-black uppercase tracking-wide mb-2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{title}</p>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>{icon}</div>
                <span className={`text-xs font-bold truncate ${value} ${i ? "whitespace-nowrap" : ""}`}>{text}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Full details action */}
        <div className="mt-auto pt-5">
          <button type="button" onClick={() => onViewDetails && onViewDetails(task)} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
            View Full Details <ExternalLink size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContributionDetails;