import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { AlertTriangle, ArrowRight } from "lucide-react";
import WorkspaceCard from "../../components/cards/WorkspaceCard";
import { getAllWorkspaces, getWorkspaceMonitorData } from "../../services/workspaceService";
import { useWorkspace } from "../../context/WorkspaceContext";
const workspacesCache = new Map();
const workspaceMonitorCache = new Map();

const Workspaces = () => {
  const liveTick = useLiveTick({ resources: ["workspaces", "projects", "tasks"] });
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { activeWorkspace } = useWorkspace();
  const workspaceId =
  activeWorkspace?._id ||
  activeWorkspace?.id ||
  null;

const workspaceCacheKey = workspaceId || "all";
const cachedWorkspaces = workspacesCache.get(workspaceCacheKey);
const cachedMonitorData = workspaceMonitorCache.get(workspaceCacheKey);

const [workspaces, setWorkspaces] = useState(cachedWorkspaces || []);
const [monitorData, setMonitorData] = useState(cachedMonitorData || []);
  const [attentionOpen, setAttentionOpen] = useState(null);
  const [loading, setLoading] = useState(!cachedWorkspaces);
  useEffect(() => {
  let cancelled = false;
  let requestInFlight = false;

  const syncWorkspaces = async () => {
    if (cancelled || requestInFlight) return;

    requestInFlight = true;

    try {
      const response = await getAllWorkspaces();

      if (cancelled || !response?.workspaces) return;

      const userRole = localStorage.getItem("role");

      const filteredWorkspaces =
        userRole !== "Project Admin" && activeWorkspace
          ? response.workspaces.filter(
              (ws) =>
                (ws._id || ws.id) ===
                (activeWorkspace._id || activeWorkspace.id)
            )
          : response.workspaces;

      setWorkspaces(filteredWorkspaces);
      workspacesCache.set(workspaceCacheKey, filteredWorkspaces);
    } catch (error) {
      if (!cancelled) {
        console.error("Error fetching workspaces:", error);
      }
    } finally {
      requestInFlight = false;
      if (!cancelled) setLoading(false);
    }
  };

  const cachedData = workspacesCache.get(workspaceCacheKey);

  if (cachedData) {
    setWorkspaces(cachedData);
    setLoading(false);

    // Background refresh without clearing existing UI
    syncWorkspaces();
  } else {
    setLoading(true);
    syncWorkspaces();
  }

  const handleFocus = () => syncWorkspaces();

  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      syncWorkspaces();
    }
  };

  window.addEventListener("focus", handleFocus);
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    cancelled = true;
    window.removeEventListener("focus", handleFocus);
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}, [activeWorkspace, workspaceCacheKey, liveTick]);

  useEffect(() => {
    if (!workspaceId) {
      setMonitorData([]);
      return;
    }
    let cancelled = false;
    let requestInFlight = false;
    const syncOverview = async () => {
      if (cancelled || requestInFlight) return;
      requestInFlight = true;

      try {
        const monitorResponse = await getWorkspaceMonitorData(workspaceId);
        if (!cancelled) {
          const nextMonitorData = Array.isArray(monitorResponse) ? monitorResponse : [];
          setMonitorData(nextMonitorData);
          workspaceMonitorCache.set(workspaceCacheKey, nextMonitorData);
        }
      } catch (error) {
        if (!cancelled) console.error("Error syncing workspace data:", error);
      } finally {
        requestInFlight = false;
      }
    };

    const cachedData = workspaceMonitorCache.get(workspaceCacheKey);
    if (cachedData) setMonitorData(cachedData);
    syncOverview();

    const handleFocus = () => syncOverview();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") syncOverview();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
     
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [workspaceId, workspaceCacheKey, liveTick]);
  const overview = useMemo(() => {
    const projects = monitorData;
    const tasks = projects.flatMap((project) => project.tasks || []);
    const now = Date.now();
    const getProjectForTask = (task) =>
      projects.find((project) =>
        (project.tasks || []).some((item) => item.taskId === task.taskId)
      );

    const overdueTaskItems = tasks
      .filter((task) => {
        if (!task.deadline || task.status?.toLowerCase() === "completed") return false;
        return new Date(task.deadline).getTime() < now;
      })
      .map((task) => {
        const project = getProjectForTask(task);
        return { ...task, projectId: project?.id, projectName: project?.name };
      });

    const pendingTaskItems = tasks
      .filter((task) => {
        const status = task.status?.toLowerCase();
        return status === "to do" || status === "todo" || status === "pending";
      })
      .map((task) => {
        const project = getProjectForTask(task);
        return { ...task, projectId: project?.id, projectName: project?.name };
      });
    const APPROACHING_DEADLINE_DAYS = 7;
    const approachingDeadlineLimit = APPROACHING_DEADLINE_DAYS * 24 * 60 * 60 * 1000;

    const approachingProjectItems = projects
      .filter((project) => {
        const status = project.status?.toLowerCase();
        if (
          !project.startDate ||
          !project.endDate ||
          status === "completed" ||
          status === "cancelled"
        ) return false;

        const startDate = new Date(project.startDate).getTime();
        const endDate = new Date(project.endDate).getTime();
        const timeUntilEnd = endDate - now;

        return (
          startDate <= now &&
          timeUntilEnd >= 0 &&
          timeUntilEnd <= approachingDeadlineLimit
        );
      })
      .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
      .map((project) => ({
        id: project.id,
        name: project.name,
        endDate: project.endDate,
        projectId: project.id,
      }));
    return {
      overdueTasks: overdueTaskItems.length,
      overdueTaskItems,
      pendingTasks: pendingTaskItems.length,
      pendingTaskItems,
      approachingProjects: approachingProjectItems.length,
      approachingProjectItems,
    };
  }, [monitorData]);
  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime())
      ? "N/A"
      : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const openProject = (projectId) => {
    if (workspaceId && projectId) {
      navigate(`/project-manager/workspaces/${workspaceId}/projects/${projectId}`);
    }
  };
  const openTask = (task) => {
    if (workspaceId && task?.projectId && task?.taskId) {
      navigate(`/project-manager/workspaces/${workspaceId}/projects/${task.projectId}/tasks/${task.taskId}`);
    } else if (task?.projectId) {
      openProject(task.projectId);
    }
  };
  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${isDarkMode ? "bg-[#05091D] text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="mb-6 shrink-0">
        <div>
          <h1  className={`text-3xl sm:text-4xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>Assigned Workspace</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Your assigned workspace and current priorities.</p>
        </div>
      </div>

      <div className="flex-1 min-h-[350px]">
        {loading ? (
          <div className="flex flex-col gap-5 w-full animate-pulse">
            <div className="w-full rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="h-5 w-2/5 min-w-[150px] rounded bg-gray-200 dark:bg-slate-800" />
                    <div className="h-3 w-3/5 min-w-[190px] rounded bg-gray-100 dark:bg-slate-800/80" />
                  </div>
                  <div className="h-8 w-24 rounded-lg bg-gray-200 dark:bg-slate-800 shrink-0" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-xl border border-gray-100 dark:border-slate-800/80 p-3 space-y-2">
                      <div className="h-2.5 w-16 rounded bg-gray-200 dark:bg-slate-800" />
                      <div className="h-4 w-12 rounded bg-gray-200 dark:bg-slate-800" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 w-24 rounded bg-gray-200 dark:bg-slate-800" />
                  <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-slate-800" />
                </div>
              </div>
            </div>

            <section className="min-w-0 h-72 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-5 w-5 rounded bg-gray-200 dark:bg-slate-800" />
                <div className="space-y-2">
                  <div className="h-4 w-36 rounded bg-gray-200 dark:bg-slate-800" />
                  <div className="h-2.5 w-56 max-w-[70vw] rounded bg-gray-100 dark:bg-slate-800/80" />
                </div>
              </div>
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-11 w-full rounded-xl bg-gray-100 dark:bg-slate-800/80" />
                ))}
              </div>
            </section>
          </div>
        ) : workspaces.length > 0 ? (
          <>
            <div className="flex flex-col gap-5">
              {workspaces.map((ws) => (
                <div key={ws._id || ws.id} className="w-full">
                  <WorkspaceCard
                    workspace={ws}
                    userRole="projectmanager"
                    viewMode="list" />
                </div>
              ))}
              {/* Needs Attention */}
              <section className="min-w-0 h-72 overflow-y-auto rounded-2xl md:col-span-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={18} className="text-amber-500" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Needs Attention</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Open a category to see all matching items.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { key: "overdue", label: `${overview.overdueTasks} overdue task${overview.overdueTasks === 1 ? "" : "s"}`, items: overview.overdueTaskItems, tone: "red" },
                    { key: "deadline", label: `${overview.approachingProjects} project${overview.approachingProjects === 1 ? "" : "s"} approaching deadline`, items: overview.approachingProjectItems, tone: "amber" },
                    { key: "pending", label: `${overview.pendingTasks} pending task${overview.pendingTasks === 1 ? "" : "s"}`, items: overview.pendingTaskItems, tone: "slate" },
                  ].map((group) => {
                    const isOpen = attentionOpen === group.key;
                    const toneClass = group.tone === "red"
                      ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300"
                      : group.tone === "amber"
                        ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
                    return (
                      <div key={group.key} className="rounded-xl overflow-hidden border border-transparent">
                        <button type="button" onClick={() => setAttentionOpen(isOpen ? null : group.key)} className={`w-full flex items-center justify-between rounded-xl px-3 py-3 text-left ${toneClass} ${group.items.length ? "hover:brightness-[0.98]" : "opacity-60"}`} disabled={!group.items.length}>
                          <span className="text-sm font-medium">{group.label}</span>
                          <ArrowRight size={15} className={`transition-transform ${isOpen ? "rotate-90" : ""}`} />
                        </button>
                        {isOpen && group.items.length > 0 && (
                          <div className="mt-1 space-y-1.5 pl-2">
                            {group.items.map((item) => (
                              <button key={item.taskId || item.projectId || item.id} type="button" onClick={() => group.key === "deadline" ? openProject(item.projectId || item.id) : openTask(item)} className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                <span className="min-w-0">
                                  <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{item.name}</span>
                                  <span className="block text-[11px] text-slate-400 truncate">{group.key === "deadline" ? `Due ${formatDate(item.endDate)}` : item.projectName || "Workspace task"}</span>
                                </span>
                                <ArrowRight size={14} className="shrink-0 text-slate-400" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>


            </div>
          </>
        ) : (
          <div className="h-full min-h-[300px] bg-white dark:bg-slate-900 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center p-12 text-center text-gray-400 dark:text-slate-500 font-medium italic">No workspaces assigned yet.</div>
        )}
      </div>
    </div>
  );
};

export default Workspaces;
