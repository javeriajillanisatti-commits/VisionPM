import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";

const taskInsightsCache = new Map();

const TaskInsights = ({
  tasks = [],
  project,
  isDarkMode,
  open,
  liveTick,
  onClose
}) => {
  const [taskInsights, setTaskInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const token = sessionStorage.getItem("token");

  const getWorkspaceId = useCallback(
    () =>
      project?.workspace?._id ||
      project?.workspace?.id ||
      project?.workspace,
    [project]
  );

  const formatInsights = useCallback((insights, taskList) => {
    const taskIds = new Set(
      taskList.map(task => String(task._id || task.id))
    );

    return insights
      .filter(insight => taskIds.has(String(insight.taskId)))
      .map(insight => ({
        type: insight.type,
        title: insight.taskTitle || "Untitled task",
        message:
          insight.message || "No additional information available.",
        level:
          insight.level === "High"
            ? "attention"
            : insight.level === "Positive"
            ? "positive"
            : "watch"
      }))
      .slice(0, 8);
  }, []);

  const fetchInsights = useCallback(
    async showLoader => {
      if (!open || !tasks.length || !token) return;

      const workspaceId = getWorkspaceId();
      const cacheKey = String(workspaceId || "all");

      try {
        if (showLoader) {
          setInsightsLoading(true);
        }

        const url = workspaceId
          ? `${process.env.REACT_APP_API_URL}/api/tasks/insights?workspaceId=${workspaceId}`
          : `${process.env.REACT_APP_API_URL}/api/tasks/insights`;

        const { data } = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const insights = data?.insights || data?.data || [];

        taskInsightsCache.set(cacheKey, insights);

        setTaskInsights(formatInsights(insights, tasks));
      } catch (error) {
        console.error(
          "Error fetching task insights:",
          error.response?.data || error
        );

        if (showLoader) {
          setTaskInsights([]);
        }
      } finally {
        if (showLoader) {
          setInsightsLoading(false);
        }
      }
    },
    [open, tasks, token, getWorkspaceId, formatInsights]
  );

  useEffect(() => {
    if (!open || !tasks.length || !token) {
      if (!open) {
        setTaskInsights([]);
        setInsightsLoading(false);
      }
      return;
    }

    const workspaceId = getWorkspaceId();
    const cacheKey = String(workspaceId || "all");
    const cachedInsights = taskInsightsCache.get(cacheKey);

    if (cachedInsights) {
      setTaskInsights(formatInsights(cachedInsights, tasks));
      setInsightsLoading(false);
      return;
    }

    fetchInsights(true);
  }, [
    open,
    tasks,
    token,
    getWorkspaceId,
    formatInsights,
    fetchInsights
  ]);

  useEffect(() => {
    if (!liveTick || !open || !tasks.length || !token) return;

    fetchInsights(false);
  }, [liveTick, open, tasks, token, fetchInsights]);

  if (!open) return null;

  const summary = [
    [
      "Attention",
      taskInsights.filter(item => item.level === "attention").length,
      "rose"
    ],
    [
      "Watch",
      taskInsights.filter(item => item.level === "watch").length,
      "amber"
    ],
    [
      "Positive",
      taskInsights.filter(item => item.level === "positive").length,
      "emerald"
    ]
  ];

  const styles = {
    attention: isDarkMode
      ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
      : "bg-rose-50/70 border-rose-100 text-rose-600",
    watch: isDarkMode
      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
      : "bg-amber-50/70 border-amber-100 text-amber-600",
    positive: isDarkMode
      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
      : "bg-emerald-50/70 border-emerald-100 text-emerald-600"
  };

  const summaryStyles = {
    rose: isDarkMode
      ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
      : "bg-rose-50 border-rose-100 text-rose-600",
    amber: isDarkMode
      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
      : "bg-amber-50 border-amber-100 text-amber-600",
    emerald: isDarkMode
      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
      : "bg-emerald-50 border-emerald-100 text-emerald-600"
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/30 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl max-h-[calc(100vh-16px)] sm:max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl flex flex-col ${
          isDarkMode
            ? "bg-[#080E22] border-[#1E293B]"
            : "bg-white border-gray-200"
        }`}
        onClick={event => event.stopPropagation()}
      >
        <div
          className={`px-4 sm:px-6 py-4 sm:py-5 border-b shrink-0 ${
            isDarkMode ? "border-[#1E293B]" : "border-gray-100"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2
                className={`text-lg sm:text-xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Task insights
              </h2>

              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                Important patterns detected across the tasks
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition shrink-0 ${
                isDarkMode
                  ? "text-gray-400 hover:text-gray-200 hover:bg-[#172443]"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <X size={17} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mt-4">
            {summary.map(([label, count, color]) => (
              <div
                key={label}
                className={`rounded-xl border px-2.5 sm:px-3 py-2.5 sm:py-3 min-w-0 ${summaryStyles[color]}`}
              >
                <p className="text-[9px] sm:text-xs font-semibold truncate">
                  {label}
                </p>

                <p className="mt-1 text-lg sm:text-xl font-bold">
                  {count}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
          {insightsLoading ? (
            <div className="py-10 text-center">
              <div
                className={`w-7 h-7 mx-auto rounded-full border-2 animate-spin ${
                  isDarkMode
                    ? "border-[#263149] border-t-blue-500"
                    : "border-gray-200 border-t-blue-600"
                }`}
              />

              <p className="mt-3 text-sm text-gray-500">
                Analyzing task data...
              </p>
            </div>
          ) : taskInsights.length ? (
            <div className="space-y-3">
              {taskInsights.map((insight, index) => (
                <div
                  key={`${insight.title}-${index}`}
                  className={`rounded-xl border p-3.5 sm:p-4 min-w-0 ${
                    styles[insight.level]
                  }`}
                >
                  <p className="text-[10px] sm:text-xs font-bold">
                    {insight.type}
                  </p>

                  <h3
                    className={`mt-1 text-sm sm:text-base font-bold break-words ${
                      isDarkMode ? "text-gray-100" : "text-gray-800"
                    }`}
                  >
                    {insight.title}
                  </h3>

                  <p
                    className={`mt-1.5 text-xs sm:text-sm leading-relaxed break-words ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {insight.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`rounded-2xl border p-5 sm:p-6 text-center ${
                isDarkMode
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-emerald-50 border-emerald-100"
              }`}
            >
              <h3
                className={`text-sm sm:text-base font-bold ${
                  isDarkMode ? "text-emerald-400" : "text-emerald-800"
                }`}
              >
                No unusual patterns detected
              </h3>

              <p
                className={`mt-1.5 text-xs sm:text-sm ${
                  isDarkMode
                    ? "text-emerald-400/80"
                    : "text-emerald-700/80"
                }`}
              >
                Current task data does not show any important monitoring
                concerns.
              </p>
            </div>
          )}
        </div>

        <div
          className={`px-4 sm:px-6 py-3.5 sm:py-4 border-t shrink-0 ${
            isDarkMode
              ? "border-[#1E293B] bg-[#0B1128]"
              : "border-gray-100 bg-gray-50/70"
          }`}
        >
          <p className="text-[10px] sm:text-xs text-gray-500 text-center leading-relaxed">
            Insights are generated from the backend using current task data
            and are for monitoring purposes only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskInsights;