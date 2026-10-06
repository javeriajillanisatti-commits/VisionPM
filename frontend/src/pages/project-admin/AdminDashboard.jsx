import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useEffect, useRef, useState } from "react";
import StatsCard from "../../components/cards/StatsCard";
import StatusProgressCard from "../../components/admin/StatusProgressCard";
import TaskDeadlineChart from "../../components/cards/dashboard/TaskDeadlineChart";
import TaskTrendChart from "../../components/cards/dashboard/TaskTrendChart";
import ProjectProgressChart from "../../components/cards/dashboard/ProjectProgressChart";
import ProjectsOverview from "../../components/cards/dashboard/RecentProjects";
import { LayoutDashboard, Briefcase, CheckCircle, BarChart3 } from "lucide-react";
import { getDashboardData } from "../../services/dashboardService";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useTheme } from "../../context/ThemeContext";

const initialDashboard = {
  workspaces: 0,
  projects: 0,
  tasks: 0,
  completion: 0,
  statusOverview: { planning: 0, inProgress: 0, completed: 0 },
  deadlineDistribution: [],
  trendData: [],
  projectProgressData: [],
  recentProjects: [],
};
const dashboardCache = new Map();

const defaultGhostData = [
  { name: "Project 1", progress: 0 },
  { name: "Project 2", progress: 0 },
  { name: "Project 3", progress: 0 },
  { name: "Project 4", progress: 0 },
  { name: "Project 5", progress: 0 },
];

const normalizeDashboard = data => {
  const d = data?.dashboard || data || {};
  return {
    workspaces: d.workspaces || 0,
    projects: d.projects || 0,
    tasks: d.tasks || 0,
    completion: d.completion || 0,
    statusOverview: d.statusOverview || initialDashboard.statusOverview,
    deadlineDistribution: d.deadlineDistribution || [],
    trendData: d.trendData || [],
    projectProgressData: d.projectProgressData?.length > 0
      ? d.projectProgressData
      : defaultGhostData,
    recentProjects: d.recentProjects || [],
  };
};

const AdminDashboard = () => {
  const liveTick = useLiveTick();
  const { activeWorkspace } = useWorkspace();
  const { isDarkMode } = useTheme();
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);
  const workspaceId = activeWorkspace?._id || null;

  const sectionHeading = `text-lg sm:text-xl lg:text-2xl font-bold tracking-tight ${
    isDarkMode ? "text-white" : "text-gray-900"
  }`;

  const card = `flex flex-col p-3 sm:p-4 rounded-[1.25rem] border shadow-sm transition-all duration-300 hover:shadow-md min-w-0 ${
    isDarkMode
      ? "bg-[#11182B] border-[#263149]"
      : "bg-white border-gray-100"
  }`;
useEffect(() => {
  let mounted = true;

  const cacheKey = workspaceId || "all";
  const cachedDashboard = dashboardCache.get(cacheKey);

  if (cachedDashboard) {
    setDashboard(cachedDashboard);
    setLoading(false);
    hasLoadedOnce.current = true;
  }

  const load = async () => {
    try {
      if (!hasLoadedOnce.current) {
        setLoading(true);
      }

      const data = await getDashboardData(workspaceId);
      const normalizedData = normalizeDashboard(data);

      if (mounted) {
        setDashboard(normalizedData);
        dashboardCache.set(cacheKey, normalizedData);
      }
    } catch (error) {
      console.error("Dashboard data loading error:", error);

      if (mounted && !cachedDashboard) {
        setDashboard(initialDashboard);
      }
    } finally {
      if (mounted) {
        setLoading(false);
        hasLoadedOnce.current = true;
      }
    }
  };

  load();

  return () => {
    mounted = false;
  };
}, [workspaceId, liveTick]);

  const totalProjects = dashboard.projects;
  const percentage = key =>
    totalProjects
      ? Math.round((dashboard.statusOverview[key] / totalProjects) * 100)
      : 0;

  if (loading) {
    return (
      <div
        className={`w-full min-h-full px-3 sm:px-5 md:px-6 lg:px-10 pt-3 sm:pt-4 pb-4 sm:pb-6 lg:pb-10 space-y-5 sm:space-y-7 overflow-x-hidden ${
          isDarkMode ? "bg-[#05091D]" : "bg-gray-50"
        }`}
      >
        <div className="space-y-3">
          {[["h-9", "w-40"], ["h-4", "w-72"]].map(([h, w]) => (
            <div
              key={h}
              className={`${h} ${w} max-w-full rounded-lg animate-pulse ${
                isDarkMode ? "bg-[#111936]" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {[4, 3].map(count => (
          <section key={count}>
            <div
              className={`h-7 w-56 max-w-full rounded-lg animate-pulse ${
                isDarkMode ? "bg-[#111936]" : "bg-gray-200"
              }`}
            />
            <div
              className={`mt-4 sm:mt-6 grid grid-cols-1 ${
                count === 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3"
              } gap-4 sm:gap-5`}
            >
              {Array.from({ length: count }, (_, i) => (
                <div
                  key={i}
                  className={`h-28 sm:h-32 rounded-[1.25rem] animate-pulse ${
                    isDarkMode ? "bg-[#11182B]" : "bg-white"
                  }`}
                />
              ))}
            </div>
          </section>
        ))}

        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {[1, 2].map(i => (
              <div
                key={i}
                className={`h-72 sm:h-80 rounded-[1.25rem] animate-pulse ${
                  isDarkMode ? "bg-[#11182B]" : "bg-white"
                }`}
              />
            ))}
          </div>
        </section>

        {[80, 72].map(height => (
          <section key={height}>
            <div
              className={`h-${height} rounded-[1.25rem] animate-pulse ${
                isDarkMode ? "bg-[#11182B]" : "bg-white"
              }`}
            />
          </section>
        ))}
      </div>
    );
  }

  const stats = [
    ["Workspaces", dashboard.workspaces, LayoutDashboard, "bg-gray-100", "bg-[#18223A]", "text-gray-500", "text-gray-300", "bg-gray-400"],
    ["Total Projects", dashboard.projects, Briefcase, "bg-blue-50", "bg-[#10284A]", "text-blue-500", "text-blue-500", "bg-blue-500"],
    ["Total Tasks", dashboard.tasks, CheckCircle, "bg-purple-50", "bg-[#261A3D]", "text-purple-500", "text-purple-500", "bg-purple-500"],
    ["Completion", `${dashboard.completion}%`, BarChart3, "bg-green-50", "bg-[#102E27]", "text-green-500", "text-green-500", "bg-green-500"],
  ];

  const statuses = [
    ["Planning", "planning", "bg-red-400"],
    ["In progress", "inProgress", "bg-orange-400"],
    ["Completed", "completed", "bg-green-500"],
  ];

  return (
    <div
      className={`w-full min-h-full px-3 sm:px-5 md:px-6 lg:px-10 pt-3 sm:pt-4 pb-4 sm:pb-6 lg:pb-10 space-y-6 sm:space-y-7 animate-in fade-in transition-colors duration-300 overflow-x-hidden ${
        isDarkMode ? "bg-[#05091D] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="space-y-1 mb-1 sm:mb-2 min-w-0">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words">
          Dashboard
        </h1>
        <p
          className={`text-xs sm:text-sm break-words ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          A complete overview of your projects, tasks, and performance.
        </p>
      </div>

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
          {stats.map(([title, count, Icon, lightBg, darkBg, lightIcon, darkIcon, accent]) => (
            <StatsCard
              key={title}
              title={title}
              count={count}
              icon={<Icon size={20} />}
              bgColor={isDarkMode ? darkBg : lightBg}
              iconColor={isDarkMode ? darkIcon : lightIcon}
              accentColor={accent}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className={sectionHeading}>Project Status Overview</h3>
        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
          {statuses.map(([title, key, color]) => (
            <StatusProgressCard
              key={key}
              title={title}
              count={dashboard.statusOverview[key]}
              percentage={percentage(key)}
              barColor={color}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className={sectionHeading}>Project Management Analytics</h3>

        <div className="mt-4 sm:mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
          <div className={card}>
            <div className="mb-3 min-w-0">
              <h4
                className={`text-sm sm:text-base lg:text-lg font-bold tracking-tight break-words ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Task Deadline Distribution
              </h4>
              <p
                className={`text-xs sm:text-sm mt-1 break-words ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Breakdown of pending tasks by due date
              </p>
            </div>
            <div className="flex-1 min-h-[190px] sm:min-h-[210px] flex items-center justify-center min-w-0 overflow-hidden">
              <TaskDeadlineChart data={dashboard.deadlineDistribution} />
            </div>
          </div>

          <div className={card}>
            <div className="mb-3 min-w-0">
              <h4
                className={`text-sm sm:text-base lg:text-lg font-bold tracking-tight break-words ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Overall Growth Trend
              </h4>
              <p
                className={`text-xs sm:text-sm mt-1 break-words ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Weekly task completion activity
              </p>
            </div>
            <div className="flex-1 min-h-[190px] sm:min-h-[210px] flex flex-col justify-center min-w-0 overflow-hidden">
              <TaskTrendChart data={dashboard.trendData} />
            </div>
          </div>
        </div>
      </section>

      <section className="min-w-0 overflow-hidden">
        <ProjectProgressChart
          data={dashboard.projectProgressData}
          userRole="projectadmin"
        />
      </section>

      <section className="min-w-0 overflow-hidden">
        <ProjectsOverview projects={dashboard.recentProjects} />
      </section>
    </div>
  );
};

export default AdminDashboard;
