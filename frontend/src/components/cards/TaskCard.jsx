import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Trash2, Calendar, ChevronDown,  CheckCircle2 } from "lucide-react";
import { updateTask } from "../../services/taskService";

const STATUS_OPTIONS = [
  { value: "Todo", label: "To Do" },
  { value: "In Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
];

const TaskStatusDropdown = ({
  value,
  onChange,
  statusColor,
  widthClass = "w-[112px] min-[600px]:w-[130px]",
  completedDisabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);
  const panelRef = useRef(null);

  const openDropdown = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) setCoords({ top: rect.bottom + 6, left: rect.right });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const closeOutside = e => {
      if (
        !containerRef.current?.contains(e.target) &&
        !panelRef.current?.contains(e.target)
      ) setOpen(false);
    };
    const closeOnMove = () => setOpen(false);

    document.addEventListener("mousedown", closeOutside);
    window.addEventListener("scroll", closeOnMove, true);
    window.addEventListener("resize", closeOnMove);

    return () => {
      document.removeEventListener("mousedown", closeOutside);
      window.removeEventListener("scroll", closeOnMove, true);
      window.removeEventListener("resize", closeOnMove);
    };
  }, [open]);

  const selectedLabel = STATUS_OPTIONS.find(opt => opt.value === value)?.label || "To Do";

  return (
    <div className={`relative shrink-0 ${widthClass}`} ref={containerRef}>    
      <button
        type="button"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          open ? setOpen(false) : openDropdown();
        }}
        className={`w-full flex items-center justify-between gap-1 px-2 min-[600px]:px-3 py-1.5 min-[600px]:py-2 rounded-xl text-[9px] min-[600px]:text-[10px] font-bold outline-none cursor-pointer border transition-colors ${statusColor}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={12} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{ position: "fixed", top: coords.top, left: coords.left, transform: "translateX(-100%)" }}
          className="z-50 w-32 min-[600px]:w-36 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden"
        >
          {STATUS_OPTIONS.map(opt => {
            const isCompletedDisabled = opt.value === "Completed" && completedDisabled;

            return (
              <button
                key={opt.value}
                type="button"
                disabled={isCompletedDisabled}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isCompletedDisabled) return;
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-[10px] min-[600px]:text-[11px] font-semibold truncate transition-colors ${
                  isCompletedDisabled
                    ? "text-slate-300 dark:text-slate-600 cursor-not-allowed bg-slate-50/60 dark:bg-slate-900/60"
                    : value === opt.value
                    ? "bg-blue-500 text-white"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
const TaskCard = ({
  task,
  userRole = "projectmanager",
  onEdit,
  onDelete,
  viewMode = "grid",
}) => {
  const { _id, id, title, taskTitle, description, status: initialStatus, priority, dueDate, deadline } = task;
  const { workspaceId, projectId } = useParams();

  const [status, setStatus] = useState(initialStatus || "Todo");
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [toast, setToast] = useState("");

  const currentId = _id || id;

  const broadcastTaskChange = (payload) => {
    try {
      if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel("vpm-task-sync");
        channel.postMessage(payload);
        channel.close();
      }
    } catch (broadcastError) {
      console.warn("Unable to broadcast task change:", broadcastError);
    }
  };

  useEffect(() => {
    const applyStatusUpdate = event => {
      const detail = event?.detail || {};
      if (detail.taskId && String(detail.taskId) === String(currentId) && detail.status) {
        setStatus(detail.status);
      }
    };

    const applyStorageUpdate = event => {
      if (event.key !== "vpm:task-status-updated" || !event.newValue) return;
      try {
        const detail = JSON.parse(event.newValue);
        if (detail.taskId && String(detail.taskId) === String(currentId) && detail.status) {
          setStatus(detail.status);
        }
      } catch (error) {
        console.warn("Unable to sync task status:", error);
      }
    };

    window.addEventListener("vpm:task-status-updated", applyStatusUpdate);
    window.addEventListener("storage", applyStorageUpdate);

    return () => {
      window.removeEventListener("vpm:task-status-updated", applyStatusUpdate);
      window.removeEventListener("storage", applyStorageUpdate);
    };
  }, [currentId]);
  const currentTitle = taskTitle || title || "Untitled Task";
  const currentDeadline = deadline || dueDate;
  const subtasksCount = task.subtasks?.length || 0;
  const commentsCount = task.commentsCount !== undefined ? task.commentsCount : task.comments?.length || 0;
  const filesCount = task.files?.length || task.filesCount || 0;
  const isListView = viewMode === "list";

  const cleanRole = userRole.toString().toLowerCase().replace(/\s+/g, "");
  const isAdmin = cleanRole === "projectadmin";
  const isPM = cleanRole === "projectmanager";
  const isTM = cleanRole === "teammember";
  const showMetadata = isPM || isTM;
  const canModify = isPM;

  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];

  // A task can be marked Completed only when there are no subtasks or every existing subtask has been completed.
  const allSubtasksCompleted =
    subtasks.length === 0 || subtasks.every(subtask => subtask?.completed === true);

  const canMarkCompleted = allSubtasksCompleted;

  const targetPath = isPM
    ? `/project-manager/workspaces/${workspaceId}/projects/${projectId}/tasks/${currentId}`
    : isAdmin
    ? "#"
    : `/team-member/tm-workspace/${workspaceId}/projects/${projectId}/tasks/${currentId}`;

  const cleanStatus = status?.toString().trim().toLowerCase();
  const progress = cleanStatus === "completed" ? 100 : cleanStatus === "in progress" || cleanStatus === "inprogress" ? 50 : 0;

  const statusColor =
    cleanStatus === "completed"
      ? "text-emerald-500 border-emerald-500 bg-transparent"
      : cleanStatus === "in progress" || cleanStatus === "inprogress"
      ? "text-amber-500 border-amber-500 bg-transparent"
      : "text-blue-500 border-blue-500 bg-transparent";

 const priorityColor =
  priority === "High"
    ? "text-[#D96B6B] border-[#D96B6B] bg-transparent"
    : priority === "Medium"
    ? "text-[#D6A832] border-[#D6A832] bg-transparent"
    : "text-[#5FAF68] border-[#5FAF68] bg-transparent";
    
  const progressColor =
    cleanStatus === "completed"
      ? "bg-emerald-500"
      : cleanStatus === "in progress" || cleanStatus === "inprogress"
      ? "bg-amber-500"
      : "bg-blue-500";

  const formatDate = date => {
    if (!date) return "N/A";
    const value = new Date(date);
    return isNaN(value.getTime()) ? "N/A" : value.toISOString().split("T")[0];
  };

  const handleStatusChange = async nextStatus => {
    if (nextStatus === "Completed" && !canMarkCompleted) {
      setToast("Task cannot be marked Completed until all subtasks are completed.");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    const previousStatus = status;
    setStatus(nextStatus);

    try {
      const response = await updateTask(currentId, { status: nextStatus });

      const updatedStatus =
        response?.task?.status ||
        response?.status ||
        response?.taskStatus ||
        nextStatus;

      setStatus(updatedStatus);
      const statusDetail = {
        type: "task-status-updated",
        taskId: currentId,
        status: updatedStatus,
        projectId,
        updatedAt: Date.now(),
      };

      window.dispatchEvent(
        new CustomEvent("vpm:task-status-updated", {
          detail: statusDetail,
        })
      );

      broadcastTaskChange(statusDetail);

      try {
        localStorage.setItem(
          "vpm:task-status-updated",
          JSON.stringify(statusDetail)
        );
        localStorage.removeItem("vpm:task-status-updated");
      } catch (storageError) {
        console.warn("Unable to broadcast task status update:", storageError);
      }
    } catch (error) {
      console.error("Error syncing status change:", error);
      setStatus(previousStatus);
      setToast(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update task status."
      );
      setTimeout(() => setToast(""), 3000);
    }
  };

  const handleDelete = e => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(currentId);
  };



  const metadata = (
    <>
      <span>{subtasksCount} subtasks</span>
      <span>•</span>
      <span>{commentsCount} comments</span>
      <span>•</span>
      <span>{filesCount} files</span>
    </>
  );

    const progressBar = (
    <div className="min-w-0 w-full">
      <div className="flex justify-between text-[11px] font-semibold">
        <span className="text-gray-500 dark:text-gray-500">Progress</span>
        <span className="text-gray-500 dark:text-gray-500 font-semibold">{progress}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );


  const toastMessage = toast && (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-xl dark:border-emerald-900/50 dark:bg-slate-900">
      <CheckCircle2 size={20} className="shrink-0 text-emerald-500" />
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{toast}</p>
    </div>
  );
  if (!isTM && isListView) {
    return (
      <div className="relative w-full min-w-0 max-w-full overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 min-[430px]:p-3 min-[600px]:p-4 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 group box-border">
        <div className="w-full min-w-0 max-w-full overflow-x-auto">
          <div className="flex items-stretch gap-0 min-w-[720px] min-[600px]:min-w-[820px] lg:min-w-0 w-full max-w-full">
            <Link to={targetPath} state={task} className="flex items-center gap-2.5 min-w-[190px] min-[600px]:min-w-0 flex-[1.4] pr-3 min-[600px]:pr-4 lg:pr-5 border-r border-slate-100 dark:border-slate-800 box-border">
              <div className="w-9 h-9 min-[430px]:w-10 min-[430px]:h-10 min-[600px]:w-11 min-[600px]:h-11 shrink-0 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xs min-[600px]:text-sm shadow-sm">
                {currentTitle.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <h3 className="text-[10px] min-[430px]:text-xs min-[600px]:text-sm font-bold text-slate-800 dark:text-slate-200 truncate tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={currentTitle}>{currentTitle}</h3>
                <p className="text-[8px] min-[430px]:text-[9px] min-[600px]:text-[11px] font-medium text-slate-500 dark:text-slate-500 truncate mt-0.5 min-[600px]:mt-1" title={description}>{description || "No description available."}</p>
              </div>
            </Link>

            <div className="flex items-center justify-center px-2 min-[430px]:px-3 min-[600px]:px-4 lg:px-5 min-w-[80px] min-[600px]:min-w-[100px] border-r border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-500 mb-1">Priority</span>
                <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold border ${priorityColor}`}>{priority || "N/A"}</span>
              </div>
            </div>

            <div className="flex flex-col justify-center px-2 min-[430px]:px-3 min-[600px]:px-4 lg:px-5 min-w-[105px] min-[600px]:min-w-[145px] lg:min-w-[180px] flex-1 border-r border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center gap-1 text-[10px] font-semibold">
                <span className="text-gray-500">Progress</span>
                <span className="text-gray-500 font-semibold">{progress}%</span>
              </div>
              <div className="h-1.5 min-[600px]:h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5 min-[600px]:mt-2">
                <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="flex flex-col justify-center items-center px-2 min-[430px]:px-3 min-[600px]:px-4 lg:px-5 min-w-[95px] min-[600px]:min-w-[110px] lg:min-w-[125px] border-r border-slate-100 dark:border-slate-800 shrink-0">
              <span className="text-[10px] font-semibold r text-gray-500 dark:text-gray-500 mb-1">Status</span>
              <span className={`w-full text-center px-2 py-0.5 rounded-md text-[12px] font-bold border ${statusColor}`}>{status === "Todo" ? "To Do" : status}</span>
            </div>

            <div className="flex flex-col justify-center px-2 min-[430px]:px-3 min-[600px]:px-4 lg:px-5 min-w-[115px] min-[600px]:min-w-[125px] lg:min-w-[145px] border-r border-slate-100 dark:border-slate-800 shrink-0">
              <span className="text-[10px] font-semibold  text-gray-500 dark:text-gray-500 mb-1">Deadline</span>
              <div className="flex items-center gap-1 min-[600px]:gap-1.5 text-[8px] min-[430px]:text-[9px] min-[600px]:text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                <Calendar size={11} className="text-slate-500 dark:text-slate-500 shrink-0" />
                {formatDate(currentDeadline)}
              </div>
            </div>

            <div className="flex flex-col justify-center px-2 min-[430px]:px-3 min-[600px]:px-4 lg:px-5 min-w-[150px] min-[600px]:min-w-[165px] lg:min-w-[190px] border-r border-slate-100 dark:border-slate-800 shrink-0">
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-500 mb-1">Details</span>
              {showMetadata ? (
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[8px] min-[600px]:text-[9px] font-semibold text-slate-500 dark:text-slate-500">{metadata}</div>
              ) : (
                <span className="text-[10px] min-[600px]:text-[9px] font-semibold text-slate-500 dark:text-slate-500">Task details</span>
              )}
            </div>

            {canModify && (
              <div className="flex items-center justify-center px-2 min-[600px]:px-3 min-w-[45px] min-[600px]:min-w-[50px] shrink-0">
                <button type="button" onClick={handleDelete} className="p-1.5 min-[600px]:p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all active:scale-90 cursor-pointer" title="Delete task">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  if (isTM && !isListView) {
    return (
      <>
        <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 min-[430px]:p-4 shadow-sm hover:shadow-md dark:hover:shadow-none transition-all duration-200 w-full h-full min-h-0 min-w-0 max-w-full flex flex-col group overflow-hidden">
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
            <TaskStatusDropdown
              value={status}
              onChange={handleStatusChange}
              statusColor={statusColor}
              completedDisabled={!canMarkCompleted}
              widthClass="w-[78px] min-[430px]:w-[92px]"
            />
        
          </div>

          <Link to={targetPath} state={task} className="flex flex-col min-w-0 max-w-full w-full">
            <div className="flex items-start gap-3 mb-2 min-w-0 pr-28 min-[430px]:pr-32">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                {currentTitle.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={currentTitle}>{currentTitle}</h3>
              </div>
            </div>

            <div className="mb-3 min-w-0">
              <p className={`text-[10px] min-[430px]:text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed break-words ${showFullDescription ? "" : "line-clamp-2"}`}>{description || "No description available."}</p>
             
            </div>

            <div className="space-y-1.5 mb-3 min-w-0">
              <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                <span className="text-slate-500 dark:text-slate-500">Status</span>
                <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold border shrink-0 ${statusColor}`}>{status === "Todo" ? "To Do" : status}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                <span className="text-slate-500 dark:text-slate-500">Priority</span>
                <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold border  shrink-0 ${priorityColor}`}>{priority || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                <span className="text-slate-500 dark:text-slate-500">Deadline</span>
                <span className="text-slate-600 dark:text-slate-300 ">{formatDate(currentDeadline)}</span>
              </div>
            </div>

            {progressBar}

            <div className="flex flex-wrap gap-x-2 gap-y-1 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-slate-500 dark:text-slate-500">{metadata}</div>
          </Link>
        </div>
        
        {toastMessage}
      </>
    );
  }
  if (isTM && isListView) {
    return (
      <>
        <div className="w-full min-w-0 max-w-full overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-2.5 min-[430px]:px-3 min-[600px]:px-4 py-2.5 min-[600px]:py-3 shadow-sm hover:shadow-md dark:hover:shadow-none transition-all duration-200 group">
          <div className="w-full min-w-0 max-w-full overflow-x-auto">
            <div className="flex items-center gap-3 min-w-[650px] min-[600px]:min-w-[760px] w-full max-w-full">
              <Link to={targetPath} state={task} className="flex items-start gap-3 min-w-[190px] min-[600px]:w-[260px] min-[600px]:flex-shrink-0 lg:w-[300px]">
                <div className="w-9 h-9 min-[600px]:w-10 min-[600px]:h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {currentTitle.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <h3 className="text-[10px] min-[430px]:text-xs min-[600px]:text-sm font-bold text-slate-800 dark:text-slate-200 truncate tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={currentTitle}>{currentTitle}</h3>
                  <p className={`mt-0.5 min-[600px]:mt-1 text-[8px] min-[430px]:text-[9px] min-[600px]:text-[11px] font-medium text-slate-500 dark:text-slate-500 leading-relaxed ${showFullDescription ? "" : "line-clamp-1"}`}>{description || "No description available."}</p>

                </div>
              </Link>

              <div className="flex-1 min-w-[240px] min-[600px]:min-w-[260px] grid grid-cols-2 gap-x-4 min-[600px]:gap-x-6 gap-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] min-[600px]:text-[11px] font-semibold text-gray-500 dark:text-gray-500">Status</span>
                  <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold border whitespace-nowrap shrink-0 ${statusColor}`}>{status === "Todo" ? "To Do" : status}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] min-[600px]:text-[11px] font-semibold text-gray-500 dark:text-gray-500">Priority</span>
                  <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold border whitespace-nowrap shrink-0 ${priorityColor}`}>{priority || "N/A"}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] min-[600px]:text-[11px] font-semibold text-gray-500 dark:text-gray-500">Deadline</span>
                  <span className="text-[9px] min-[600px]:text-[10px] font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDate(currentDeadline)}</span>
                </div>
                <div className="flex items-center gap-1 min-[600px]:gap-1.5 text-[8px] min-[600px]:text-[9px] font-semibold text-slate-500 dark:text-slate-500 truncate overflow-hidden">{metadata}</div>
              </div>
              <div className="w-[90px] min-[600px]:w-[110px] lg:w-[130px] flex-shrink-0 ml-2">
                {progressBar}
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                <TaskStatusDropdown
                  value={status}
                  onChange={handleStatusChange}
                  statusColor={statusColor}
                  completedDisabled={!canMarkCompleted}
                />
              
              </div>
            </div>
          </div>
        </div>
   
        {toastMessage}
      </>
    );
  }

  // Admin and PM grid view render section
  const CardWrapper = isAdmin ? "div" : Link;
  const wrapperProps = isAdmin
    ? { className: "flex flex-col w-full min-w-0" }
    : { to: targetPath, state: task, className: "flex flex-col w-full min-w-0" };

  return (
    <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 min-[430px]:p-4 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 w-full h-full min-h-0 min-w-0 max-w-full group overflow-hidden">
      {canModify && (
        <div className="absolute top-3 right-3 flex items-center z-20">
          <button type="button" onClick={handleDelete} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all active:scale-90 cursor-pointer" title="Delete task">
            <Trash2 size={15} />
          </button>
        </div>
      )}

      <CardWrapper {...wrapperProps}>
        <div className="mb-2 pr-8 min-w-0">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={currentTitle}>
            {currentTitle}
          </h3>
        </div>

        <p className="text-[10px] min-[430px]:text-[11px] font-medium text-slate-500 dark:text-slate-500 line-clamp-2 mb-2 leading-relaxed break-words">
          {description || "No description available."}
        </p>

        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 min-w-0">
          {[
            ["Status", status === "Todo" ? "To Do" : status, statusColor],
            ["Priority", priority || "N/A", priorityColor],
          ].map(([label, value, color]) => (
            <div key={label} className="flex justify-between items-center gap-2 text-[11px] min-w-0">
              <span className="font-semibold text-slate-500 dark:text-slate-500">{label}</span>
              <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold border bg-transparent whitespace-nowrap shrink-0 ${color}`}>
                {value}
              </span>
            </div>
          ))}

          <div className="flex justify-between items-center gap-2 text-[11px] min-w-0">
            <span className="font-semibold text-slate-500 dark:text-slate-500">Deadline</span>
            <span className="font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDate(currentDeadline)}</span>
          </div>
        </div>

        <div className="mt-3">{progressBar}</div>

        {showMetadata && (
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-semibold text-slate-500 dark:text-slate-500 border-t pt-2.5 mt-2.5 border-slate-100 dark:border-slate-800">
            {metadata}
          </div>
        )}
      </CardWrapper>
    </div>
  );
};

export default TaskCard;
