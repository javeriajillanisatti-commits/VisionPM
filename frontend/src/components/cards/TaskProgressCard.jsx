import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import PredictDelayButton from "../buttons/PredictDelayButton";
import axios from "axios";
import { X, AlertTriangle, CheckCircle2, Info } from "lucide-react";

const TaskProgressCard = ({ project, viewMode }) => {
  const [prediction, setPrediction] = useState(null);
  const [projectPredictions, setProjectPredictions] = useState([]);
  const [predictingTaskId, setPredictingTaskId] = useState(null);
  const [predictingProject, setPredictingProject] = useState(false);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [predictionStatuses, setPredictionStatuses] = useState({});
  const API_URL = `${process.env.REACT_APP_API_URL}/api/delay-prediction`;
  const { isDarkMode } = useTheme();

  const tasks = useMemo(
    () => (Array.isArray(project?.tasks) ? project.tasks : []),
    [project?.tasks]
  );
  const projectProgress = Number(project?.progress || 0);
  const projectCompleted = projectProgress >= 100;

  const taskKey = useCallback(
    (task) => String(task?.taskId || task?._id || task?.id || ""),
    []
  );

  const taskCompleted = useCallback((task) => {
    const progress = Number(task?.progress ?? 0);
    const status = String(task?.status || "").trim().toLowerCase();
    return progress >= 100 || status === "completed";
  }, []);

  const buildTaskPayload = useCallback((task) => ({
    taskId: taskKey(task),
    taskName: task?.name || task?.taskName || "Untitled Task",
    priority: task?.priority || "Medium",
    workload: task?.workload || 0,
    progress: task?.progress || 0,
    time_left: task?.time_left || 0,
  }), [taskKey]);

  const applyProjectPredictionStatuses = useCallback((results) => {
    const next = {};
    (results || []).forEach((item) => {
      if (item?.taskId) {
        next[String(item.taskId)] = item.result === "Delayed" ? "delayed" : "safe";
      }
    });
    setPredictionStatuses(next);
  }, []);

  const taskSignature = useMemo(
    () =>
      tasks
        .map((task) =>
          [
            taskKey(task),
            task?.status || "",
            task?.progress ?? 0,
            task?.priority || "",
            task?.workload ?? 0,
            task?.time_left ?? 0,
          ].join(":")
        )
        .join("|"),
    [tasks, taskKey]
  );

  useEffect(() => {
    let cancelled = false;

    const predictActiveTasks = async () => {
      const activeTasks = tasks.filter((task) => !taskCompleted(task));
      if (!activeTasks.length) {
        if (!cancelled) setPredictionStatuses({});
        return;
      }

      try {
        const res = await axios.post(
          `${API_URL}/predict-batch`,
          { tasks: activeTasks.map(buildTaskPayload) },
          { withCredentials: true }
        );
        if (!cancelled) applyProjectPredictionStatuses(res.data.results || []);
      } catch (error) {
        if (!cancelled) setPredictionStatuses({});
      }
    };

    predictActiveTasks();
    return () => {
      cancelled = true;
    };
  }, [
    project?.id,
    project?._id,
    taskSignature,
    tasks,
    buildTaskPayload,
    taskCompleted,
    applyProjectPredictionStatuses,
     API_URL,
  ]);

  const handlePredictDelay = async (task) => {
    if (taskCompleted(task)) return;

    try {
      const id = taskKey(task);
      setPredictingTaskId(id);
      setPrediction(null);

      const res = await axios.post(
        `${API_URL}/predict`,
        {
          priority: task.priority || "Medium",
          workload: task.workload || 0,
          progress: task.progress || 0,
          time_left: task.time_left || 0,
        },
        { withCredentials: true }
      );

      const result = {
        taskId: id,
        taskName: task.name || task.taskName || "Untitled Task",
        result: res.data.result,
        confidence: res.data.confidence,
        timeRemaining: task.time_left || 0,
        workload: task.workload || 0,
      };

      setPrediction(result);
      setPredictionStatuses((prev) => ({
        ...prev,
        [id]: result.result === "Delayed" ? "delayed" : "safe",
      }));
      setModalType("task");
      setShowPredictionModal(true);
    } catch (e) {
      setPrediction({
        taskId: taskKey(task),
        taskName: task.name || task.taskName || "Untitled Task",
        result: "Prediction Failed",
        confidence: null,
        timeRemaining: task.time_left || 0,
        workload: task.workload || 0,
      });
      setModalType("task");
      setShowPredictionModal(true);
    } finally {
      setPredictingTaskId(null);
    }
  };

  const handlePredictProject = async () => {
    if (projectCompleted || !tasks.length) return;

    const activeTasks = tasks.filter((task) => !taskCompleted(task));
    if (!activeTasks.length) return;

    try {
      setPredictingProject(true);
      setProjectPredictions([]);
      setPrediction(null);

      const res = await axios.post(
        `${API_URL}/predict-batch`,
        { tasks: activeTasks.map(buildTaskPayload) },
        { withCredentials: true }
      );

      const results = (res.data.results || []).map((item) => {
        const orig = activeTasks.find((t) => taskKey(t) === String(item.taskId));
        return {
          taskId: item.taskId,
          taskName: item.taskName || orig?.name || orig?.taskName || "Untitled Task",
          result: item.result,
          confidence: item.confidence,
          timeRemaining: orig?.time_left || 0,
          workload: orig?.workload || 0,
        };
      });

      setProjectPredictions(results);
      applyProjectPredictionStatuses(results);
      setModalType("project");
      setShowPredictionModal(true);
    } catch (e) {
      setProjectPredictions([]);
      setModalType("project");
      setShowPredictionModal(true);
    } finally {
      setPredictingProject(false);
    }
  };

  const closePredictionModal = () => {
    setShowPredictionModal(false);
    setModalType(null);
  };

  const formatDate = (str) => (!str || str === "N/A") ? "N/A" : str.substring(0, 10);
  const currentProjectName = project.projectName || project.name || "Untitled Project";

  const projectRisk = useMemo(() => {
    if (projectCompleted) return "disabled";
    const statuses = Object.values(predictionStatuses);
    if (statuses.includes("delayed")) return "delayed";
    if (statuses.length && statuses.every((status) => status === "safe")) return "safe";
    return "normal";
  }, [projectCompleted, predictionStatuses]);

  return (
    <>
      <div className={`bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm transition-all duration-300 w-full flex flex-col justify-between ${viewMode === "compact" ? "min-h-[460px]" : ""}`}>
        <div className={`mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 gap-2 ${viewMode === "compact" ? "grid grid-cols-1" : "flex flex-col sm:flex-row sm:items-center sm:justify-between"}`}>
          <h3 className={`text-lg font-bold tracking-tight min-w-0 flex-1 whitespace-nowrap overflow-hidden text-ellipsis ${isDarkMode ? "text-white" : "text-gray-800"}`} title={currentProjectName}>
            {currentProjectName}
          </h3>
          <div className={`${viewMode === "compact" ? "w-full" : "w-full sm:w-auto shrink-0"}`}>
            <div className="[&>button]:w-full [&>button]:px-5 [&>button]:py-2.5 [&>button]:text-xs sm:[&>button]:text-sm">
              <PredictDelayButton variant="table" onClick={handlePredictProject} predictionStatus={projectRisk} disabled={projectCompleted} loading={predictingProject} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { l: "Total Tasks", v: project.total, bg: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300" },
            { l: "To Do", v: project.todo, bg: "bg-blue-50/60 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/20 text-blue-600 dark:text-blue-400" },
            { l: "In Progress", v: project.inProgress, bg: "bg-amber-50/70 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/20 text-amber-600 dark:text-amber-400" },
            { l: "Completed", v: project.completed, bg: "bg-emerald-50/60 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/20 text-emerald-600 dark:text-emerald-400" }
          ].map((x, i) => (
            <div key={i} className={`text-center p-2 rounded-xl border shadow-sm ${x.bg}`}>
              <p className="text-[11px] sm:text-[13px] font-bold opacity-75 mb-0.5 whitespace-nowrap truncate">{x.l}</p>
              <p className="text-lg sm:text-xl font-bold tracking-tight">{x.v || 0}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Overall Progress</span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">{projectProgress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-700/40">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${projectProgress}%` }} />
          </div>
        </div>

        <div className="w-full mt-auto">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 px-1 flex items-center gap-1">Tasks List</h4>
          <div className="overflow-x-auto overflow-y-auto max-h-[160px] custom-scrollbar border border-slate-200/60 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                <tr>
                  {["Task", "Status", "Priority", "Deadline", "Assigned To", "Action"].map((h, i) => (
                    <th key={i} className="p-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {tasks.length > 0 ? (
                  tasks.map((task, idx) => {
                    const statusLabel = task.status || "Todo";
                    const taskId = taskKey(task);
                    const completed = taskCompleted(task);
                    const taskRisk = completed ? "disabled" : (predictionStatuses[taskId] || "normal");
                    
                     const priorityTextColor =
                       task.priority === "High"
                       ? "text-[#D96B6B] border-[#D96B6B] dark:text-[#D96B6B] dark:border-[#D96B6B]"
                        : task.priority === "Medium"
                        ? "text-[#D6A832] border-[#D6A832] dark:text-[#D6A832] dark:border-[#D6A832]"
                        : "text-[#5FAF68] border-[#5FAF68] dark:text-[#5FAF68] dark:border-[#5FAF68]";

                    const statusTextColor = statusLabel === "Completed"
                      ? "text-emerald-500 border-emerald-500 dark:text-emerald-400 dark:border-emerald-400"
                      : statusLabel === "In Progress"
                      ? "text-amber-500 border-amber-500 dark:text-amber-400 dark:border-amber-400"
                      : "text-blue-500 border-blue-500 dark:text-blue-400 dark:border-blue-400";
                    
                    return (
                      <tr key={taskId || idx} className="relative group hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors text-xs font-medium">
                        <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]" title={task.name || "Untitled Task"}>{task.name || "Untitled Task"}</td>
                        <td className="p-2.5"><span className={`text-[11px] font-bold border px-2 py-0.5 rounded-md whitespace-nowrap ${statusTextColor}`}>{statusLabel === "Todo" ? "To Do" : statusLabel}</span></td>
                        <td className="p-2.5"><span className={`text-[11px] font-bold border px-2 py-0.5 rounded-md whitespace-nowrap ${priorityTextColor}`}>{task.priority || "Medium"}</span></td>
                        <td className="p-2.5 text-slate-500 dark:text-slate-400 font-semibold text-[11px] whitespace-nowrap">{formatDate(task.dueDate)}</td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[100px]" title={task.assignedTo || "Unassigned"}>{task.assignedTo || "Unassigned"}</td>
                        <td className="p-2.5 whitespace-nowrap">
                          <PredictDelayButton variant="table" onClick={() => handlePredictDelay(task)} predictionStatus={taskRisk} disabled={completed} loading={predictingTaskId === taskId} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="6" className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/40 dark:bg-slate-900/40">No active tasks associated.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showPredictionModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm" onMouseDown={closePredictionModal}>
          <div className="w-full max-w-4xl max-h-[90dvh] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">{modalType === "project" ? "Project Delay Prediction" : "Task Delay Prediction"}</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">{modalType === "project" ? currentProjectName : prediction?.taskName}</p>
              </div>
              <button type="button" onClick={closePredictionModal} className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800">
                <X size={17} />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(90dvh-78px)]">
              {modalType === "project" ? (
                projectPredictions.length ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950/40">
                        <p className="text-[12px] font-bold text-slate-500">Project Result</p>
                        <p className={`mt-1 text-lg font-bold ${projectPredictions.some((x) => x.result === "Delayed") ? "text-rose-500" : "text-emerald-500"}`}>{projectPredictions.some((x) => x.result === "Delayed") ? "Delayed" : "Not Delayed"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950/40">
                        <p className="text-[12px] font-bold text-slate-500">Tasks Checked</p>
                        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{projectPredictions.length}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950/40">
                        <p className="text-[12px] font-bold text-slate-500">Delayed Tasks</p>
                        <p className="mt-1 text-lg font-bold text-rose-500">{projectPredictions.filter((x) => x.result === "Delayed").length}</p>
                      </div>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full min-w-[650px] text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800">
                          <tr>{["Task", "Prediction", "Confidence", "Time Remaining", "Workload"].map((h) => <th key={h} className="p-3 text-xs font-bold text-slate-600 dark:text-slate-300">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {projectPredictions.map((item) => (
                            <tr key={item.taskId}>
                              <td className="p-3 text-xs font-bold text-slate-800 dark:text-slate-100">{item.taskName}</td>
                              <td className={`p-3 text-xs font-bold ${item.result === "Delayed" ? "text-rose-500" : "text-emerald-500"}`}>{item.result}</td>
                              <td className="p-3 text-xs font-semibold text-slate-700 dark:text-slate-300">{item.confidence !== null ? `${item.confidence}%` : "N/A"}</td>
                              <td className="p-3 text-xs font-semibold text-slate-700 dark:text-slate-300">{item.timeRemaining || 0} days</td>
                              <td className="p-3 text-xs font-semibold text-slate-700 dark:text-slate-300">{item.workload || 0} points</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-sm text-slate-500"><Info className="mx-auto mb-2" size={28} />Unable to generate project prediction.</div>
                )
              ) : prediction ? (
                <div className="space-y-4">
                  <div className={`rounded-xl border p-4 ${prediction.result === "Delayed" ? "border-rose-500 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20" : prediction.result === "Not Delayed" ? "border-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20" : "border-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20"}`}>
                    <div className="flex items-center gap-2">
                      {prediction.result === "Delayed" ? <AlertTriangle size={20} className="text-rose-500" /> : prediction.result === "Not Delayed" ? <CheckCircle2 size={20} className="text-emerald-500" /> : <Info size={20} className="text-amber-500" />}
                      <span className="text-lg font-bold">{prediction.result}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4"><p className="text-[12px] font-bold text-slate-500">Confidence</p><p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{prediction.confidence !== null ? `${prediction.confidence}%` : "N/A"}</p></div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4"><p className="text-[12px] font-bold text-slate-500">Time Remaining</p><p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{prediction.timeRemaining || 0} days</p></div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4"><p className="text-[12px] font-bold text-slate-500">Workload</p><p className="mt-1 text-lg font-bold text-indigo-500 dark:text-indigo-400">{prediction.workload || 0} points</p></div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskProgressCard;