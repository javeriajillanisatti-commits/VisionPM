import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { AlertTriangle, ArrowRight } from "lucide-react";
import WorkspaceCard from "../../components/cards/WorkspaceCard";
import { getAllWorkspaces, getWorkspaceMonitorData } from "../../services/workspaceService";
import { useWorkspace } from "../../context/WorkspaceContext";

const Workspaces = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { activeWorkspace } = useWorkspace();
  const [workspaces, setWorkspaces] = useState([]);
  const [monitorData, setMonitorData] = useState([]);
  const [attentionOpen, setAttentionOpen] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const syncWorkspaces = async () => {
      try {
        const response = await getAllWorkspaces();
        if (cancelled || !response?.workspaces) return;
        const userRole = localStorage.getItem("role");
        if (userRole !== "Project Admin" && activeWorkspace) {
          setWorkspaces(response.workspaces.filter((ws) =>
            (ws._id || ws.id) === (activeWorkspace._id || activeWorkspace.id)
          ));
        } else {
          setWorkspaces(response.workspaces);
        }
      } catch (error) {
        if (!cancelled) console.error("Error fetching workspaces:", error);
      }
    };

    syncWorkspaces();
    const intervalId = setInterval(syncWorkspaces, 2000);
    const handleFocus = () => syncWorkspaces();
    const handleVisibility = () => { if (document.visibilityState === "visible") syncWorkspaces(); };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [activeWorkspace]);

  const workspaceId = activeWorkspace?._id || activeWorkspace?.id ||  workspaces[0]?._id || workspaces[0]?.id;
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
          setMonitorData(Array.isArray(monitorResponse) ? monitorResponse : []);
        }
      } catch (error) {
        if (!cancelled) console.error("Error syncing workspace data:", error);
      } finally {
        requestInFlight = false;
      }
    };

    syncOverview();
    const intervalId = setInterval(syncOverview, 2000);
    const handleFocus = () => syncOverview();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") syncOverview();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [workspaceId]);
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
        {workspaces.length > 0 ? (
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