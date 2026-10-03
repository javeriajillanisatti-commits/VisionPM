import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useParams, Link } from "react-router-dom";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import TaskForm from "../../components/forms/TaskForm";
import TaskCard from "../../components/cards/TaskCard";
import TaskFilters from "../../components/tasks/TaskFilters";
import TaskControls from "../../components/tasks/TaskControls";
import ProjectDiscussion from "../../components/project/ProjectDiscussion";
import { ArrowLeft, AlertTriangle, Inbox, ClipboardList } from "lucide-react";
import { createTask, getTasksByProject, deleteTask } from "../../services/taskService";
import { getProjectById } from "../../services/projectService";

const getTaskId = (task) => task?._id || task?.id;
const PRIORITY_WEIGHT = { High: 3, Medium: 2, Low: 1 };
const weightOf = (t) => PRIORITY_WEIGHT[t.priority] || 0;
const createdOf = (t) => new Date(t.createdAt || t.id);

const SORTERS = {
  priority_high: (a, b) => weightOf(b) - weightOf(a),
  priority_low: (a, b) => weightOf(a) - weightOf(b),
  deadline: (a, b) =>
    !a.deadline ? 1 : !b.deadline ? -1 : new Date(a.deadline) - new Date(b.deadline),
  newest: (a, b) => createdOf(b) - createdOf(a),
  oldest: (a, b) => createdOf(a) - createdOf(b),
};

const EmptyState = ({ icon: Icon, title, text }) => (
  <div className="h-[320px] sm:h-[380px] border border-dashed border-gray-200 dark:border-slate-800/80 rounded-[2rem] flex flex-col items-center justify-center p-6 text-center bg-white/40 dark:bg-[#11182B]/40 transition-all duration-500">
    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800/60 rounded-2xl flex items-center justify-center mb-4 shadow-sm text-indigo-600 dark:text-indigo-400">
      <Icon size={20} className="stroke-[1.5]" />
    </div>
    <h3 className="text-gray-700 dark:text-gray-200 text-sm font-bold tracking-tight mb-1">{title}</h3>
    <p className="text-gray-400 dark:text-slate-500 text-[11px] font-medium max-w-sm leading-relaxed">{text}</p>
  </div>
);

const Tasks = () => {
  const liveTick = useLiveTick({ resources: ["tasks", "projects"] });
  const { projectId } = useParams();
  const { isDarkMode } = useTheme();
  const [projectTitle, setProjectTitle] = useState("Project Tasks");
  const [projectDescription, setProjectDescription] = useState("No description available.");
  const [projectInfo, setProjectInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("All Tasks");
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");
  const [conflictSeverity, setConflictSeverity] = useState("Warning");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [deleteTaskTitle, setDeleteTaskTitle] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [pendingTaskPayload, setPendingTaskPayload] = useState(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  const applyProject = (res) => {
    const proj = res?.project || res;
    if (!proj) return;
    setProjectInfo(proj);
    setProjectTitle(proj.projectName || proj.title || "Project Tasks");
    setProjectDescription(proj.description || "No description available.");
  };

  const applyTasks = (res) => setTasks(res?.tasks || (Array.isArray(res) ? res : []));

  // Poll project + tasks every second, and on focus / tab visible.
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    let requestInFlight = false;

    const sync = async () => {
      if (cancelled || requestInFlight) return;
      requestInFlight = true;
      try {
        const projResponse = await getProjectById(projectId);
        if (!cancelled) applyProject(projResponse);
        const taskResponse = await getTasksByProject(projectId);
        if (!cancelled) applyTasks(taskResponse);
      } catch (error) {
        if (!cancelled) console.error("Error fetching tasks pipeline elements:", error);
      } finally {
        requestInFlight = false;
      }
    };
    const onVisible = () => document.visibilityState === "visible" && sync();

    sync();
  
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [projectId, liveTick]);

  const fetchProjectMetaAndTasks = async () => {
    try {
      applyProject(await getProjectById(projectId));
      applyTasks(await getTasksByProject(projectId));
      setVisibleCount(6);
    } catch (error) {
      console.error("Error fetching tasks pipeline elements:", error);
    }
  };

  // Real-time task sync: same tab, other tabs, and immediate backend refresh.
  useEffect(() => {
    const refresh = async () => {
      try {
        applyTasks(await getTasksByProject(projectId));
      } catch (error) {
        console.warn("Unable to refresh tasks after real-time update:", error);
      }
    };

    const updateLocalTask = (detail) => {
      if (!detail) return;
      const incomingTask = detail.task || detail.updatedTask || detail;
      const incomingId = detail.taskId || getTaskId(incomingTask);
      if (!incomingId) return;

      setTasks((prev) =>
        prev.map((task) => {
          if (String(getTaskId(task)) !== String(incomingId)) return task;
          if (incomingTask && typeof incomingTask === "object" && getTaskId(incomingTask)) {
            return { ...task, ...incomingTask };
          }
          return detail.status ? { ...task, status: detail.status } : task;
        })
      );
    };

    const onUpdated = (e) => {
      updateLocalTask(e?.detail);
      refresh();
    };

    const onCreated = (e) => {
      const incoming = e?.detail?.task || e?.detail?.createdTask || e?.detail;
      if (!incoming || typeof incoming !== "object") return;
      const incomingProjectId = incoming.projectId || e?.detail?.projectId;
      if (incomingProjectId && String(incomingProjectId) !== String(projectId)) return;
      const incomingId = getTaskId(incoming);
      if (!incomingId) return;

      setTasks((prev) =>
        prev.some((t) => String(getTaskId(t)) === String(incomingId))
          ? prev.map((t) => (String(getTaskId(t)) === String(incomingId) ? { ...t, ...incoming } : t))
          : [incoming, ...prev]
      );
    };

    const onDeleted = (e) => {
      const detail = e?.detail || {};
      const deletedId = detail.taskId || detail.id || getTaskId(detail.task);
      if (!deletedId) return;
      setTasks((prev) => prev.filter((t) => String(getTaskId(t)) !== String(deletedId)));
    };

    const handlers = {
      "vpm:task-status-updated": onUpdated,
      "vpm:task-updated": onUpdated,
      "vpm:task-created": onCreated,
      "vpm:task-deleted": onDeleted,
    };

    const onStorage = (e) => {
      if (!e?.key || !e.newValue || !handlers[e.key]) return;
      try {
        handlers[e.key]({ detail: JSON.parse(e.newValue) });
      } catch (error) {
        console.warn("Unable to sync task changes:", error);
      }
    };

    const onBroadcast = (e) => {
      const detail = e?.data || {};
      if (detail.type) handlers[`vpm:${detail.type}`]?.({ detail });
    };

    Object.entries(handlers).forEach(([name, fn]) => window.addEventListener(name, fn));
    window.addEventListener("storage", onStorage);

    const channel = "BroadcastChannel" in window ? new BroadcastChannel("vpm-task-sync") : null;
    channel?.addEventListener("message", onBroadcast);

    return () => {
      Object.entries(handlers).forEach(([name, fn]) => window.removeEventListener(name, fn));
      window.removeEventListener("storage", onStorage);
      channel?.removeEventListener("message", onBroadcast);
      channel?.close();
    };
  }, [projectId]);

  const getProcessedTasks = () => {
    let result = tasks.filter(
      (t) =>
        activeTab === "All Tasks" ||
        t.status?.toString().toLowerCase() === activeTab.toString().toLowerCase()
    );
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t) => t.taskTitle?.toLowerCase().includes(query));
    }
    return SORTERS[sortBy] ? result.sort(SORTERS[sortBy]) : result;
  };

  const processedTasks = getProcessedTasks();
  const paginatedTasks = processedTasks.slice(0, visibleCount);

  const countBy = (...statuses) => tasks.filter((t) => statuses.includes(t.status)).length;
  const filterCounts = {
    all: tasks.length,
    todo: countBy("To Do", "Todo"),
    inprogress: countBy("In Progress"),
    completed: countBy("Completed"),
  };

  const handleAddTask = async (taskPayload) => {
    try {
      await createTask({ ...taskPayload, projectId });
      await fetchProjectMetaAndTasks();
      return true;
    } catch (error) {
      if (error.conflict) {
        setPendingTaskPayload(taskPayload);
        setConflictMessage(error.message);
        setConflictSeverity(error.severity || "Warning");
        setShowConflictModal(true);
      } else {
        alert(error.message || "A task with this title already exists. Please use a different task title.");
      }
      return false;
    }
  };

  const handleConfirmConflict = async () => {
    if (!pendingTaskPayload) return;
    try {
      await createTask({ ...pendingTaskPayload, projectId, forceCreate: true });
      await fetchProjectMetaAndTasks();
      setShowConflictModal(false);
      setShowModal(false);
      setPendingTaskPayload(null);
      setConflictSeverity("Warning");
      return true;
    } catch (retryError) {
      alert(retryError.message || "Failed to force assign task.");
      return false;
    }
  };

  const handleDeleteTaskData = (id, taskTitle = "this task") => {
    setDeleteTaskId(id);
    setDeleteTaskTitle(taskTitle);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const closeDeleteTaskModal = () => {
    setShowDeleteModal(false);
    setDeleteTaskId(null);
    setDeleteTaskTitle("");
    setDeleteError("");
  };

  const confirmDeleteTask = async () => {
    if (!deleteTaskId || isDeletingTask) return;
    setIsDeletingTask(true);
    setDeleteError("");

    try {
      await deleteTask(deleteTaskId);
      setTasks((prev) => prev.filter((t) => getTaskId(t) !== deleteTaskId));

      const detail = { taskId: deleteTaskId, projectId, deletedAt: Date.now() };
      window.dispatchEvent(new CustomEvent("vpm:task-deleted", { detail }));
      try {
        localStorage.setItem("vpm:task-deleted", JSON.stringify(detail));
        localStorage.removeItem("vpm:task-deleted");
      } catch (storageError) {
        console.warn("Unable to broadcast task deletion:", storageError);
      }
      closeDeleteTaskModal();
    } catch (error) {
      console.error("Error executing task delete:", error);
      setDeleteError(
        error?.response?.data?.message || error?.message || "Unable to delete the task. Please try again."
      );
    } finally {
      setIsDeletingTask(false);
    }
  };

  // Shared pieces (rendered in mobile / laptop / tablet slots below)
  const filters = <TaskFilters activeFilter={activeTab} setActiveFilter={setActiveTab} counts={filterCounts} />;
  const discussion = <ProjectDiscussion project={projectInfo} />;
  const controls = (
    <TaskControls
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      sortBy={sortBy}
      setSortBy={setSortBy}
      viewMode={viewMode}
      setViewMode={setViewMode}
      showViewToggle={true}
    />
  );

  const btnCancel = "w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all active:scale-95";

  return (
    <>
      <div className="w-full flex flex-col mt-3 pt-0 px-3 sm:px-4 md:px-6 pb-4 sm:pb-6 max-w-7xl mx-auto animate-in fade-in text-gray-900 dark:text-white bg-transparent transition-colors duration-200 relative min-w-0 overflow-x-hidden">
        <div className="pb-2 sm:pb-4 pt-1 sm:pt-2 relative shrink-0">
          <div className="w-full flex flex-col lg:flex-row justify-between items-start gap-2 sm:gap-4 mb-1 sm:mb-2">
            <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0 w-full lg:max-w-[calc(100%-13rem)]">
              <Link
                to={-1}
                className="p-2 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-all active:scale-90 flex items-center justify-center shrink-0"
              >
                <ArrowLeft size={18} className="text-gray-600 dark:text-slate-400" strokeWidth={2.5} />
              </Link>

              <div className="min-w-0 flex-1 flex flex-col gap-1">
                <h1
                  className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight break-words ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {projectTitle}
                </h1>

                <div className="min-w-0 block">
                  <p
                    className={`text-xs sm:text-sm mt-1 pr-2 break-words ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    } ${isDescExpanded ? "" : "line-clamp-1"}`}
                  >
                    {projectDescription}
                  </p>

                  {projectDescription.length > 120 && (
                    <button
                      type="button"
                      onClick={() => setIsDescExpanded((v) => !v)}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1 cursor-pointer block"
                    >
                      {isDescExpanded ? "Show Less" : "Show More"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 w-full sm:w-auto lg:absolute lg:right-0 lg:top-10">
              <div className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-44 rounded-lg">
                <PrimaryButton text="+ Create Task" onClick={() => setShowModal(true)} />
              </div>

              {/* Laptop: Project Discussion under Create Task */}
              <div className="hidden lg:block w-44 mt-3 [&>button]:w-full [&>button]:justify-center">
                {discussion}
              </div>
            </div>
          </div>

          {/* Task controls */}
          <div className="w-full flex flex-col gap-2 shrink-0 pt-0 sm:pt-2 lg:pt-5">
            {/* Mobile: 2x2 grid -> [All Tasks | Project Discussion] / [Search | Sort By] */}
            <div className="sm:hidden w-full grid grid-cols-2 gap-2">
              <div className="min-w-0 [&>*]:w-full [&_select]:w-full [&_select]:h-10">{filters}</div>
              <div className="min-w-0 [&>button]:w-full [&>button]:h-10 [&>button]:justify-center [&>button_svg]:hidden">
                {discussion}
              </div>
              <div className="col-span-2 min-w-0">{controls}</div>
            </div>

            {/* Tablet / laptop: status filters */}
            <div className="hidden sm:block min-w-0 pt-2 pb-2 max-w-full overflow-x-auto custom-scrollbar scrollbar-thin">
              {filters}
            </div>

            {/* Tablet / laptop: Search + Sort */}
            <div className="hidden sm:block w-full min-w-0">{controls}</div>

            {/* Tablet only: Project Discussion (laptop shows it under Create Task) */}
            <div className="hidden sm:block lg:hidden">{discussion}</div>
          </div>
        </div>

        {/* Task cards */}
        <div className="w-full min-h-[200px] sm:min-h-[400px] min-w-0 pt-2">
          {paginatedTasks.length > 0 ? (
            <div className="flex flex-col items-center">
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pb-6 w-full"
                    : "flex flex-col gap-4 pb-6 w-full"
                }
              >
                {paginatedTasks.map((task) => (
                  <TaskCard
                    key={getTaskId(task)}
                    task={{ ...task, id: getTaskId(task) }}
                    userRole="projectmanager"
                    viewMode={viewMode}
                    onDelete={(id) => {
                      const current = paginatedTasks.find((t) => getTaskId(t) === id);
                      handleDeleteTaskData(id, current?.taskTitle || current?.title || "this task");
                    }}
                  />
                ))}
              </div>

              {processedTasks.length > visibleCount && (
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="mt-4 px-6 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold shadow-sm transition-all text-slate-700 dark:text-slate-300 active:scale-95"
                >
                  Load More Tasks
                </button>
              )}
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No Tasks Created Yet"
              text={`You don't have any tasks yet. Click on "Create Task" to create your first task.`}
            />
          ) : (
            <EmptyState
              icon={Inbox}
              title="No Matching Results"
              text="No data available for the specified search query."
            />
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative z-50 w-full max-w-lg max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2rem)] overflow-y-auto">
            <TaskForm onClose={() => setShowModal(false)} onSubmit={handleAddTask} />
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-task-title"
            className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <AlertTriangle size={21} strokeWidth={2.4} />
                </div>
                <div className="min-w-0">
                  <h3 id="delete-task-title" className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                    Delete task?
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400 break-words">
                    Are you sure you want to delete {deleteTaskTitle}?
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-3.5 py-3 text-sm font-medium text-red-700 dark:text-red-300">
                  {deleteError}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                <button type="button" onClick={closeDeleteTaskModal} disabled={isDeletingTask} className={btnCancel}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTask}
                  disabled={isDeletingTask}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isDeletingTask ? "Deleting..." : "Delete Task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConflictModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 max-w-md w-full max-h-[calc(100vh-1.5rem)] overflow-y-auto shadow-2xl border border-gray-100 dark:border-slate-800 transform transition-all animate-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3 text-amber-500 mb-4">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg shrink-0">
                <AlertTriangle size={24} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-slate-200 tracking-tight">
                  {conflictSeverity === "Strong Warning" ? "Strong Assignment Warning" : "Assignment Conflict Detected"}
                </h3>
                <span
                  className={`inline-flex mt-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    conflictSeverity === "Strong Warning"
                      ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  }`}
                >
                  {conflictSeverity}
                </span>
              </div>
            </div>

            <div className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed mb-6 bg-gray-50 dark:bg-slate-800/50 p-3 sm:p-4 rounded-xl border border-gray-100 dark:border-slate-700/60">
              {conflictMessage.split("\n\n").map((message, index) => (
                <p key={index} className="mb-3 last:mb-0 whitespace-pre-line leading-relaxed">
                  {message
                    .replace(/[()"]/g, "")
                    .replace("with the same deadline", "with the same deadline:")}
                </p>
              ))}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConflictModal(false);
                  setPendingTaskPayload(null);
                }}
                className="px-4 py-2 text-sm font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl active:scale-95 transition-all w-full sm:w-auto"
              >
                Cancel Assignment
              </button>
              <button
                onClick={handleConfirmConflict}
                className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-md active:scale-95 transition-all w-full sm:w-auto"
              >
                Assign Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Tasks;
