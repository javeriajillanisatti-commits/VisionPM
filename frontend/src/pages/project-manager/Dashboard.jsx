import React, { useState, useEffect, useRef } from "react";
import { useWorkspace } from "../../context/WorkspaceContext"; 
import { useTheme } from "../../context/ThemeContext";
import StatsCard from "../../components/cards/StatsCard";
import TaskPriorityChart from "../../components/cards/dashboard/TaskPriorityChart";
import TaskTrendChart from "../../components/cards/dashboard/PMTaskTrendChart";
import ProjectTimeline from "../../components/cards/dashboard/ProjectTimeline";
import PMProjectPipeline from "../../components/cards/dashboard/PMProjectsPipeline";
import { FolderKanban,ListTodo, CheckCircle2, CircleDot, Activity } from "lucide-react";
import axios from "axios";

const Dashboard = () => {
  const { activeWorkspace } = useWorkspace(); 
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0, totalTasks: 0, todoCount: 0, progressCount: 0, doneCount: 0, priorityData: [
      { name: "High Priority", value: 0 },
      { name: "Medium Priority", value: 0 },
      { name: "Low Priority", value: 0 }
    ], projectsProgress: [], trendData: [], recentProjects: [] });
  const dashboardRequestInFlight = useRef(false);
  useEffect(() => {
  const targetWorkspaceId = activeWorkspace?.id || activeWorkspace?._id;
  const token = sessionStorage.getItem("token");
    if (!targetWorkspaceId || !token || token === "null" || token === "undefined") {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    let intervalId = null;
    const fetchDashboardLiveStats = async ({ showLoader = false } = {}) => {
      if (cancelled || dashboardRequestInFlight.current) return;
      dashboardRequestInFlight.current = true;
      if (showLoader) setLoading(true);
      try {
        const response = await axios.get(
         `${process.env.REACT_APP_API_URL}/api/dashboard/stats/${targetWorkspaceId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!cancelled && response.data) {
          setStats(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Dashboard Stats Fetch Error:", err);
        }
      } finally {
        dashboardRequestInFlight.current = false;
        if (showLoader && !cancelled) setLoading(false);
      }
    };
    // data load for first time
    fetchDashboardLiveStats({ showLoader: true });
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchDashboardLiveStats();
      }
    };
    const handleWindowFocus = () => {fetchDashboardLiveStats(); };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus)
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      dashboardRequestInFlight.current = false;
    };
  }, [activeWorkspace]);
  if (loading) {
    return (
      <div className="py-32 text-center text-gray-400 font-bold animate-pulse text-sm uppercase tracking-widest">
        Loading workspace dashboard metrics...
      </div>
    );
  }
  return (
    <div
      className={`w-full min-screen p-6 sm:px-6 lg:px-10 pt-4 pb-4 sm:pb-6 lg:pb-10 space-y-7 animate-in fade-in transition-colors duration-300 ${
        isDarkMode ? "bg-[#05091D] text-white" : "bg-gray-50 text-gray-900"}`} >
      {/* Dashboard ka header text */}
      <div className="space-y-1 mb-2">
        <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Dashboard
        </h1>
        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          A complete overview of your workspace projects and tasks.
        </p>
      </div>
      {/* Main Stats Grid jahan cards ke colors status ke mutabiq set hain */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 items-stretch">
        <StatsCard title="Total Projects" count={stats.totalProjects} icon={<FolderKanban size={18} />} bgColor={isDarkMode ? "bg-[#10284A]" : "bg-indigo-50/60"} iconColor="text-indigo-600 dark:text-indigo-400"/>
        <StatsCard title="Total Tasks" count={stats.totalTasks} icon={<ListTodo size={18} />} bgColor={isDarkMode ? "bg-[#261A3D]" : "bg-purple-50/60"} iconColor="text-purple-600 dark:text-purple-400"/>
        <StatsCard title="To Do" count={stats.todoCount} icon={<CircleDot size={18} />} bgColor={isDarkMode ? "bg-[#10244a]" : "bg-blue-50/60"} iconColor="text-blue-600 dark:text-blue-400"/>
        <StatsCard title="In Progress" count={stats.progressCount} icon={<Activity size={18} />} bgColor={isDarkMode ? "bg-[#3D2E1A]" : "bg-amber-50/60"} iconColor="text-amber-600 dark:text-amber-400"/>
        <StatsCard title="Completed" count={stats.doneCount}  icon={<CheckCircle2 size={18} />} bgColor={isDarkMode ? "bg-[#102E27]" : "bg-green-50/60"} iconColor="text-green-600 dark:text-green-400" />
      </div>
      {/* Dono Priority aur Trend Charts yahan grid mein hain */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch w-full">
        <TaskPriorityChart data={stats.priorityData} />
        <TaskTrendChart data={stats.trendData} />
      </div>
      {/* Project timeline section */}
      <div className="w-full min-w-0">
        <ProjectTimeline projects={stats.projectsProgress} />
      </div>
      {/* Project pipeline tracker section */}
      <div className="mt-2 min-w-0">
        <PMProjectPipeline projects={stats.recentProjects} />
      </div>
    </div>
  );
};
export default Dashboard;
