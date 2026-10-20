import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useState, useEffect, useRef } from "react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useTheme } from "../../context/ThemeContext";
import StatsCard from "../../components/cards/StatsCard";
import TaskPriorityChart from "../../components/cards/dashboard/TaskPriorityChart";
import TaskTrendChart from "../../components/cards/dashboard/PMTaskTrendChart";
import ProjectTimeline from "../../components/cards/dashboard/ProjectTimeline";
import PMProjectPipeline from "../../components/cards/dashboard/PMProjectsPipeline";
import { FolderKanban, ListTodo, CheckCircle2, CircleDot, Activity } from "lucide-react"; import axios from "axios";

const dashboardCache = new Map();
const Dashboard = () => {
  const liveTick = useLiveTick({ resources: ["dashboard", "projects", "tasks"] });
  const { activeWorkspace } = useWorkspace();
  const { isDarkMode } = useTheme();

  const targetWorkspaceId = activeWorkspace?.id || activeWorkspace?._id;
  const cacheKey = targetWorkspaceId || "all";
  const cachedStats = dashboardCache.get(cacheKey);

  const [loading, setLoading] = useState(!cachedStats);
  const [stats, setStats] = useState(cachedStats || {
    totalProjects: 0,
    totalTasks: 0,
    todoCount: 0,
    progressCount: 0,
    doneCount: 0,
    priorityData: [
      { name: "High Priority", value: 0 },
      { name: "Medium Priority", value: 0 },
      { name: "Low Priority", value: 0 }
    ],
    projectsProgress: [],
    trendData: [],
    recentProjects: []
  });

  const dashboardRequestInFlight = useRef(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    if (
      !targetWorkspaceId ||
      !token ||
      token === "null" ||
      token === "undefined"
    ) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const fetchDashboardLiveStats = async ({ showLoader = false } = {}) => {
      if (cancelled || dashboardRequestInFlight.current) return;

      dashboardRequestInFlight.current = true;

      const cachedData = dashboardCache.get(cacheKey);

      if (showLoader && !cachedData) {
        setLoading(true);
      }

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/dashboard/stats/${targetWorkspaceId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!cancelled && response.data) {
          setStats(response.data);
          dashboardCache.set(cacheKey, response.data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Dashboard Stats Fetch Error:", err);

          const cachedData = dashboardCache.get(cacheKey);

          if (cachedData) {
            setStats(cachedData);
          }
        }
      } finally {
        dashboardRequestInFlight.current = false;

        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (dashboardCache.has(cacheKey)) {
      setStats(dashboardCache.get(cacheKey));
      setLoading(false);
      fetchDashboardLiveStats();
    } else {
      fetchDashboardLiveStats({ showLoader: true });
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchDashboardLiveStats();
      }
    };

    const handleWindowFocus = () => {
      fetchDashboardLiveStats();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      dashboardRequestInFlight.current = false;
    };
  }, [targetWorkspaceId, cacheKey, liveTick]);

  if (loading) {
    const skeletonBase = isDarkMode ? "bg-white/10" : "bg-gray-200";

    return (
      <div className={`w-full min-h-screen p-6 sm:px-6 lg:px-10 pt-4 pb-4 sm:pb-6 lg:pb-10 space-y-7 ${isDarkMode ? "bg-[#05091D] text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="space-y-2 mb-2 animate-pulse">
          <div className={`h-9 sm:h-10 w-40 rounded-md ${skeletonBase}`} />
          <div className={`h-4 w-80 max-w-full rounded-md ${skeletonBase}`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 items-stretch">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className={`rounded-xl border p-5 min-h-[120px] animate-pulse ${
                isDarkMode
                  ? "bg-[#0B1230] border-white/10"
                  : "bg-white border-gray-100" }`}>
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className={`h-3 w-24 rounded ${skeletonBase}`} />
                  <div className={`h-8 w-16 rounded ${skeletonBase}`} />
                </div>
                <div className={`h-9 w-9 rounded-lg ${skeletonBase}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch w-full">
          {[1, 2].map((item) => (
            <div
              key={item}
              className={`rounded-xl border min-h-[320px] p-5 animate-pulse ${
                isDarkMode
                  ? "bg-[#0B1230] border-white/10"
                  : "bg-white border-gray-100"}`} >
              <div className="space-y-3">
                <div className={`h-5 w-40 rounded ${skeletonBase}`} />
                <div className={`h-3 w-56 rounded ${skeletonBase}`} />
              </div>

              <div className="mt-8 flex items-end justify-between gap-3 h-52">
                <div className={`h-20 w-8 rounded ${skeletonBase}`} />
                <div className={`h-32 w-8 rounded ${skeletonBase}`} />
                <div className={`h-24 w-8 rounded ${skeletonBase}`} />
                <div className={`h-40 w-8 rounded ${skeletonBase}`} />
                <div className={`h-28 w-8 rounded ${skeletonBase}`} />
                <div className={`h-44 w-8 rounded ${skeletonBase}`} />
                <div className={`h-24 w-8 rounded ${skeletonBase}`} />
              </div>
            </div>
          ))}
        </div>

        <div
          className={`w-full min-w-0 rounded-xl border min-h-[280px] p-5 animate-pulse ${
            isDarkMode
              ? "bg-[#0B1230] border-white/10"
              : "bg-white border-gray-100"
          }`}
        >
          <div className="space-y-3">
            <div className={`h-5 w-44 rounded ${skeletonBase}`} />
            <div className={`h-3 w-64 rounded ${skeletonBase}`} />
          </div>

          <div className="mt-8 space-y-5">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-4">
                <div className={`h-4 w-28 rounded ${skeletonBase}`} />
                <div className={`h-6 flex-1 rounded ${skeletonBase}`} />
              </div>
            ))}
          </div>
        </div>

        <div
          className={`mt-2 min-w-0 rounded-xl border min-h-[280px] p-5 animate-pulse ${
            isDarkMode
              ? "bg-[#0B1230] border-white/10"
              : "bg-white border-gray-100"}`}>
          <div className="space-y-3">
            <div className={`h-5 w-48 rounded ${skeletonBase}`} />
            <div className={`h-3 w-60 rounded ${skeletonBase}`} />
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className={`h-32 rounded-lg ${skeletonBase}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full min-screen p-6 sm:px-6 lg:px-10 pt-4 pb-4 sm:pb-6 lg:pb-10 space-y-7 animate-in fade-in transition-colors duration-300 ${
        isDarkMode ? "bg-[#05091D] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="space-y-1 mb-2">
       <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>Dashboard</h1> 
       <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>A complete overview of your workspace projects and tasks.</p>
     </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 items-stretch">
          <StatsCard title="Total Projects" count={stats.totalProjects} icon={<FolderKanban size={18} />} bgColor={isDarkMode ? "bg-[#10284A]" : "bg-indigo-50/60"} iconColor="text-indigo-600 dark:text-indigo-400" />
          <StatsCard title="Total Tasks" count={stats.totalTasks} icon={<ListTodo size={18} />} bgColor={isDarkMode ? "bg-[#261A3D]" : "bg-purple-50/60"} iconColor="text-purple-600 dark:text-purple-400" />
          <StatsCard title="To Do" count={stats.todoCount} icon={<CircleDot size={18} />} bgColor={isDarkMode ? "bg-[#10244a]" : "bg-blue-50/60"} iconColor="text-blue-600 dark:text-blue-400" />
          <StatsCard title="In Progress" count={stats.progressCount} icon={<Activity size={18} />} bgColor={isDarkMode ? "bg-[#3D2E1A]" : "bg-amber-50/60"} iconColor="text-amber-600 dark:text-amber-400" />
          <StatsCard title="Completed" count={stats.doneCount} icon={<CheckCircle2 size={18} />} bgColor={isDarkMode ? "bg-[#102E27]" : "bg-green-50/60"} iconColor="text-green-600 dark:text-green-400" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch w-full">
        <TaskPriorityChart data={stats.priorityData} />
        <TaskTrendChart data={stats.trendData} />
      </div>

      <div className="w-full min-w-0">
        <ProjectTimeline projects={stats.projectsProgress} />
      </div>

      <div className="mt-2 min-w-0">
        <PMProjectPipeline projects={stats.recentProjects} />
      </div>
    </div>
  );
};

export default Dashboard;
