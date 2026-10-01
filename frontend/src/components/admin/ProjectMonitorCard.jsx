import React, { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const ProjectMonitorCard = ({ project, onView, onEdit, onDelete }) => {
  const { isDarkMode } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [isDescriptionLong, setIsDescriptionLong] = useState(false);
  const menuRef = useRef(null);
  const descriptionRef = useRef(null);

  const {
    _id, projectName, description, status, workspace, createdBy,
    totalTasks = 0, todo = 0, inProgress = 0, completed = 0,
  } = project;

  useEffect(() => {
    const closeMenu = event => {
      if (menuRef.current && !menuRef.current.contains(event.target))
        setShowMenu(false);
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  useEffect(() => {
    const element = descriptionRef.current;
    if (!element || !description) return setIsDescriptionLong(false);
    setIsDescriptionLong(element.scrollHeight > element.clientHeight + 1);
  }, [description]);

  const counts = {
    todo: Math.max(0, Number(todo) || 0),
    inProgress: Math.max(0, Number(inProgress) || 0),
    completed: Math.max(0, Number(completed) || 0),
  };

  const calculatedTotal = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const displayTotal = calculatedTotal || Number(totalTasks) || 0;
  const progress = calculatedTotal
    ? Math.round(((counts.inProgress * 50) + (counts.completed * 100)) / calculatedTotal)
    : 0;

  const statusStyle = value => {
    switch ((value || "").toLowerCase().trim()) {
      case "completed":
        return isDarkMode
          ? "bg-green-500/10 text-green-400 border-green-500/20"
          : "bg-green-50 text-green-600 border-green-100";
      case "in progress":
      case "inprogress":
        return isDarkMode
          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
          : "bg-amber-50 text-amber-600 border-amber-100";
      default:
        return isDarkMode
          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
          : "bg-blue-50 text-blue-600 border-blue-100";
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    onEdit();
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDelete(_id);
  };

  const mutedText = isDarkMode ? "text-gray-500" : "text-gray-400";
  const normalText = isDarkMode ? "text-gray-400" : "text-gray-500";
  const blueText = isDarkMode ? "text-blue-400" : "text-blue-600";
  const statText = isDarkMode ? "text-gray-200" : "text-gray-800";

  const stats = [
    [
      "Total Tasks",
      displayTotal,
      isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200",
      isDarkMode ? "text-slate-300" : "text-slate-700",
      statText,
    ],
    [
      "To Do",
      counts.todo,
      isDarkMode ? "bg-blue-950/10 border-blue-900/20" : "bg-blue-50/60 border-blue-100",
      isDarkMode ? "text-blue-400" : "text-blue-600",
      isDarkMode ? "text-blue-400" : "text-blue-600",
    ],
    [
      "In Progress",
      counts.inProgress,
      isDarkMode ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-100",
      isDarkMode ? "text-amber-400" : "text-amber-500",
      isDarkMode ? "text-amber-400" : "text-amber-600",
    ],
    [
      "Completed",
      counts.completed,
      isDarkMode ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-100",
      isDarkMode ? "text-green-400" : "text-green-500",
      isDarkMode ? "text-green-400" : "text-green-600",
    ],
  ];

  return (
    <div
      className={`w-full min-w-0 flex flex-col border rounded-2xl min-[600px]:rounded-3xl p-3.5 min-[430px]:p-5 min-[600px]:p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-300 ${
        isDarkMode
          ? "bg-[#0B1128] border-[#1E293B] hover:border-blue-500/30"
          : "bg-white border-gray-200 hover:border-blue-100"
      }`}
    >
      {/* Project information and actions */}
      <div className="flex flex-col min-[600px]:flex-row justify-between items-start gap-3 min-[600px]:gap-5 min-w-0">
        <div className="min-w-0 flex-1 w-full">
          <p className="text-[11px] min-[430px]:text-sm font-medium mb-1.5 leading-tight">
            <span className={mutedText}>Workspace:</span>{" "}
            <span className={`${blueText} font-semibold whitespace-normal break-words`}>
              {workspace?.name || "No Workspace"}
            </span>
          </p>

          <h3
            className={`text-lg min-[430px]:text-2xl sm:text-[26px] font-bold tracking-tight leading-tight whitespace-normal break-words ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {projectName}
          </h3>

          {description && (
            <div className="mt-1.5 min-w-0">
              <p
                ref={descriptionRef}
                className={`text-[13px] min-[430px]:text-sm leading-5 ${normalText} whitespace-normal break-words ${
                  showDescription ? "" : "line-clamp-1"
                }`}
              >
                {description}
              </p>
              {isDescriptionLong && (
                <button
                  type="button"
                  onClick={() => setShowDescription(value => !value)}
                  className={`text-xs font-semibold mt-1 whitespace-nowrap ${blueText} ${
                    isDarkMode ? "hover:text-blue-300" : "hover:text-blue-700"
                  }`}
                >
                  {showDescription ? "Show Less" : "Show More"}
                </button>
              )}
            </div>
          )}

          <div className="relative group block min-w-0">
            <p className="text-[13px] min-[430px]:text-sm mt-3 cursor-default leading-tight">
              <span className={mutedText}>Manager:</span>{" "}
              <span className={`${blueText} font-semibold whitespace-normal break-words`}>
                {createdBy?.fullName || "Project Manager"}
              </span>
            </p>

            <div
              className={`absolute left-0 top-full mt-2 z-30 w-52 max-w-[calc(100vw-2rem)] rounded-xl border p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none ${
                isDarkMode ? "bg-[#111936] border-[#263149]" : "bg-white border-gray-200"
              }`}
            >
              <p className={`text-[10px] uppercase tracking-wider font-bold ${mutedText}`}>
                Project Manager
              </p>
              <p
                className={`text-sm font-semibold mt-1 whitespace-normal break-words ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                {createdBy?.fullName || "Project Manager"}
              </p>
              {createdBy?.email && (
                <p className={`text-xs mt-1 break-all ${normalText}`}>{createdBy.email}</p>
              )}
            </div>
          </div>

          <div className="block mt-2">
            <span
              className={`inline-flex items-center max-w-full px-3 py-1.5 rounded-full text-[9px] min-[430px]:text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${statusStyle(status)}`}
            >
              {status || "Planning"}
            </span>
          </div>
        </div>

        <div className="w-full min-[600px]:w-auto min-w-0 pb-1 flex justify-end">
          <div className="relative flex items-center justify-end gap-2 min-w-0">
            <button
              type="button"
              onClick={onView}
              className="shrink-0 px-2 min-[430px]:px-3 min-[600px]:px-4 py-2.5 bg-blue-600 text-white text-[10px] min-[430px]:text-[11px] font-bold rounded-xl border border-blue-600 hover:bg-blue-700 hover:border-blue-700 active:scale-[0.98] transition-all shadow-sm whitespace-nowrap"
            >
              View Details
            </button>

            <div ref={menuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowMenu(value => !value)}
                aria-label="Project actions"
                className={`w-9 h-9 min-[430px]:w-10 min-[430px]:h-10 rounded-xl border flex items-center justify-center transition-all active:scale-[0.96] ${
                  isDarkMode
                    ? "bg-[#111936] border-[#263149] text-gray-400 hover:text-white hover:bg-[#18223A]"
                    : "bg-white border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <MoreVertical size={18} />
              </button>

              {showMenu && (
                <div
                  className={`absolute right-0 top-full mt-2 z-[100] w-36 rounded-xl border p-1.5 shadow-xl ${
                    isDarkMode ? "bg-[#111936] border-[#263149]" : "bg-white border-gray-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={handleEdit}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      isDarkMode
                        ? "text-gray-300 hover:bg-blue-500/10 hover:text-blue-400"
                        : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      isDarkMode
                        ? "text-gray-300 hover:bg-red-500/10 hover:text-red-400"
                        : "text-gray-700 hover:bg-red-50 hover:text-red-600"
                    }`}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Show project progress */}
      <div className="mt-5 space-y-2.5 min-w-0">
        <div className="flex flex-col min-[430px]:flex-row min-[430px]:justify-between min-[430px]:items-center gap-1.5 min-w-0">
          <span className={`text-[9px] min-[430px]:text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>
            Project Progress
          </span>
          <span className={`text-[11px] min-[430px]:text-sm font-bold ${blueText} min-w-0 whitespace-normal break-words`}>
            {counts.completed}/{displayTotal} Completed ({progress}%)
          </span>
        </div>

        <div className={`relative h-3 sm:h-4 w-full rounded-full overflow-hidden ${isDarkMode ? "bg-[#1E293B]" : "bg-gray-200"}`}>
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Show task statistics */}
      <div
        className={`grid grid-cols-2 min-[600px]:grid-cols-4 gap-2 min-[430px]:gap-3 pt-4 min-[600px]:pt-5 mt-5 border-t ${
          isDarkMode ? "border-[#1E293B]" : "border-gray-100"
        }`}
      >
        {stats.map(([label, value, className, labelClass, valueClass]) => (
          <div
            key={label}
            className={`min-w-0 rounded-xl border px-2.5 min-[430px]:px-4 py-3 min-[430px]:py-4 ${className}`}
          >
            <p
              className={`text-[12px] sm:text-[14px] font-bold tracking-wide whitespace-nowrap ${labelClass}`}
            >
              {label}
            </p>
            <p className={`text-lg min-[430px]:text-xl font-bold mt-1 ${valueClass}`}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectMonitorCard;