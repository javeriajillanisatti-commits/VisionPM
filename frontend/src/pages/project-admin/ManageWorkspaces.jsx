import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import WorkspaceForm from "../../components/forms/WorkspaceForm";
import WorkspaceCard from "../../components/cards/WorkspaceCard";
import ProjectHealthScanner from "../../components/admin/ProjectHealthScanner";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useTheme } from "../../context/ThemeContext";
import { BriefcaseBusiness, Search, SlidersHorizontal, AlertCircle, CheckCircle2, Clock3, X, Grid3X3, List, ChevronDown } from "lucide-react";
import { getAllWorkspaces, deleteWorkspace as deleteWorkspaceAPI, getWorkspaceMonitorData } from "../../services/workspaceService";

const SORT_OPTIONS = [["", "Sort By"], ["recent", "Most Recent"], ["oldest", "Oldest First"], ["projects", "Most Projects"], ["leastProjects", "Least Projects"]];

const SORTS = {
  recent: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  oldest: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
  projects: (a, b) => (b.projectsCount || 0) - (a.projectsCount || 0),
  leastProjects: (a, b) => (a.projectsCount || 0) - (b.projectsCount || 0),
};

const workspaceCache = new Map();
const workspaceHealthCache = new Map();
const HEALTH = {
  risk: ["At Risk", AlertCircle, "bg-red-500/10 text-red-400 border-red-500/20", "bg-red-50 text-red-600 border-red-100"],
  attention: ["Needs Attention", Clock3, "bg-amber-500/10 text-amber-400 border-amber-500/20", "bg-amber-50 text-amber-600 border-amber-100"],
  healthy: ["Healthy", CheckCircle2, "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", "bg-emerald-50 text-emerald-600 border-emerald-100"],
};


const THEME = {
  dark: {
    page: "bg-[#05091D]",
    panel: "bg-[#0B1128] border-[#1E293B]",
    skel: "bg-[#111936]",
    surface: "bg-[#11182B] border-[#263149] text-gray-200 placeholder:text-gray-500",
    ghost: "hover:bg-[#17213A]",
    muted: "text-gray-400",
    icon: "text-gray-500",
    clear: "bg-white/10 hover:bg-white/20 text-gray-300",
    option: "text-gray-300 hover:bg-[#1E293B]",
    toggle: "text-gray-400 hover:text-white hover:bg-[#1D2940]",
    title: "text-white",
    hint: "text-gray-500",
    emptyIcon: "bg-blue-500/10 text-blue-400",
    msgBox: "bg-[#111C38] text-gray-300",
  },
  light: {
    page: "bg-gray-50",
    panel: "bg-white border-gray-200",
    skel: "bg-gray-200",
    surface: "bg-white border-gray-200 text-gray-700 placeholder:text-gray-400",
    ghost: "hover:bg-gray-50",
    muted: "text-gray-500",
    icon: "text-gray-400",
    clear: "bg-gray-100 hover:bg-gray-200 text-gray-600",
    option: "text-gray-700 hover:bg-blue-50",
    toggle: "text-gray-500 hover:text-gray-800 hover:bg-gray-100",
    title: "text-gray-900",
    hint: "text-gray-400",
    emptyIcon: "bg-blue-50 text-blue-500",
    msgBox: "bg-gray-50 text-gray-600",
  },
};

const idOf = ws => String(ws?._id || ws?.id || "");
const norm = v => String(v || "").trim().toLowerCase();
const isOverdue = task => Number(task.time_left) < 0 && norm(task.status) !== "completed";
const isRisky = p => Number(p.progress || 0) < 40 || (p.tasks || []).some(isOverdue);

const GRID = "grid grid-cols-1 min-[600px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 w-full min-w-0";
const LIST = "flex flex-col gap-3 sm:gap-4 w-full min-w-0";
const PAGE = "min-h-screen w-full max-w-full overflow-x-hidden p-3 sm:p-4 min-[600px]:p-6";

const DeleteModal = ({ ws, busy, t, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
    <div className={`w-full max-w-md rounded-2xl shadow-2xl border p-4 sm:p-6 max-h-[95vh] overflow-y-auto ${t.panel}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={`text-base sm:text-lg font-bold ${t.title}`}>Delete Workspace?</h2>
          <p className={`text-xs mt-0.5 ${t.hint}`}>This action cannot be undone.</p>
        </div>
        <button type="button" disabled={busy} onClick={onCancel} className={`p-1.5 rounded-lg ${t.toggle}`}>
          <X size={18} />
        </button>
      </div>

      <div className={`mt-4 sm:mt-5 rounded-xl p-3 sm:p-4 ${t.msgBox}`}>
        <p className="text-sm break-words">
          Are you sure you want to delete <span className="mx-1">"{ws.name}"</span>?
        </p>
      </div>

      <div className="mt-5 sm:mt-6 flex flex-wrap justify-end gap-2 sm:gap-3">
        <button type="button" disabled={busy} onClick={onCancel} className={`px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold border ${t.surface} ${t.ghost} ${busy ? "opacity-50 cursor-not-allowed" : ""}`}>
          Cancel
        </button>
        <button type="button" disabled={busy} onClick={onConfirm} className={`px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 ${busy ? "opacity-60 cursor-not-allowed" : ""}`}>
          {busy ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  </div>
);

const ManageWorkspaces = () => {
  const liveTick = useLiveTick({ resources: ["workspaces", "projects", "tasks"] });
  const { activeWorkspace, allWorkspacesSelected, setActiveWorkspace, clearWorkspaceSelection, refreshWorkspaceList } = useWorkspace();
  const { isDarkMode } = useTheme();
  const t = isDarkMode ? THEME.dark : THEME.light;
  const [searchParams, setSearchParams] = useSearchParams();

  const [showModal, setShowModal] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [healthWorkspace, setHealthWorkspace] = useState(null);
  const [healthData, setHealthData] = useState([]);
  const [healthLoading, setHealthLoading] = useState(false);
const healthRequestIdRef = useRef(0);
  const requestIdRef = useRef(0);
  const sortRef = useRef(null);
  const hasLoadedOnceRef = useRef(false);
  const activeWorkspaceId = activeWorkspace?.id || null;

  const fetchWorkspaces = useCallback(async (showLoader = true) => {
  if (!allWorkspacesSelected && !activeWorkspaceId) {
    setWorkspaces([]);
    
    return;
  }

  const cacheKey = allWorkspacesSelected
    ? "all"
    : String(activeWorkspaceId);

  const cachedWorkspaces = workspaceCache.get(cacheKey);

  if (showLoader && !cachedWorkspaces && !hasLoadedOnceRef.current) {

  }

  const requestId = ++requestIdRef.current;

  try {
    const res = await getAllWorkspaces(
      allWorkspacesSelected ? undefined : activeWorkspaceId
    );

    if (requestId !== requestIdRef.current) return;

    const list = res?.workspaces || res || [];

    const freshWorkspaces = allWorkspacesSelected
      ? list
      : list.filter(
          ws => idOf(ws) === String(activeWorkspaceId)
        );

    setWorkspaces(freshWorkspaces);
    workspaceCache.set(cacheKey, freshWorkspaces);

    hasLoadedOnceRef.current = true;
  } catch (error) {
    if (requestId === requestIdRef.current) {
      console.error("Error fetching workspaces:", error);

      const cachedData = workspaceCache.get(cacheKey);

      if (cachedData) {
        setWorkspaces(cachedData);
      } else {
        setWorkspaces([]);
      }
    }
  } finally {
    if (requestId === requestIdRef.current) {
      
    }
  }
}, [activeWorkspaceId, allWorkspacesSelected]);

useEffect(() => {
  const cacheKey = allWorkspacesSelected
    ? "all"
    : String(activeWorkspaceId);

  const cachedWorkspaces = workspaceCache.get(cacheKey);

  if (cachedWorkspaces) {
    setWorkspaces(cachedWorkspaces);
    
    hasLoadedOnceRef.current = true;

    fetchWorkspaces(false);
    return;
  }

  fetchWorkspaces(true);
}, [
  activeWorkspaceId,
  allWorkspacesSelected,
  fetchWorkspaces,
  liveTick,
]);


  useEffect(() => {
    if (searchParams.get("create") !== "true") return;
    setEditingWorkspace(null);
    setShowModal(true);
    searchParams.delete("create");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

 
  useEffect(() => {
    const onClick = e => sortRef.current && !sortRef.current.contains(e.target) && setSortOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const openCreate = () => {
    setEditingWorkspace(null);
    setShowModal(true);
  };

  const closeForm = () => {
    setShowModal(false);
    setEditingWorkspace(null);
    fetchWorkspaces();
  };

 const addWorkspace = workspace => {
  if (allWorkspacesSelected || idOf(workspace) === String(activeWorkspaceId)) {
    setWorkspaces(prev => {
      const updated = [...prev, workspace];

      const cacheKey = allWorkspacesSelected
        ? "all"
        : String(activeWorkspaceId);

      workspaceCache.set(cacheKey, updated);

      return updated;
    });
  }

  refreshWorkspaceList();
};
  const updateWorkspace = workspace => {
    const id = idOf(workspace);
    setWorkspaces(prev => prev.map(ws => (idOf(ws) === id ? workspace : ws)));
    if (String(activeWorkspace?.id) === id) setActiveWorkspace(workspace);
    refreshWorkspaceList();
  };

  const confirmDeleteWorkspace = async () => {
    if (!workspaceToDelete || isDeleting) return;
    const id = idOf(workspaceToDelete);
    setIsDeleting(true);

    try {
      await deleteWorkspaceAPI(id);
    setWorkspaces(prev => {
  const updated = prev.filter(ws => idOf(ws) !== id);

  const cacheKey = allWorkspacesSelected
    ? "all"
    : String(activeWorkspaceId);

  workspaceCache.set(cacheKey, updated);

  return updated;
});
      if (String(activeWorkspace?.id) === id) {
        clearWorkspaceSelection();
        setWorkspaces([]);
      }
      setWorkspaceToDelete(null);
      refreshWorkspaceList();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Cannot delete workspace. Please remove all associated projects and tasks before attempting to delete.");
    } finally {
      setIsDeleting(false);
    }
  };

const openHealthScanner = async workspace => {
  const id = idOf(workspace);
  if (!id) return;

  const cacheKey = String(id);
  const cachedHealth = workspaceHealthCache.get(cacheKey);

  setHealthWorkspace(workspace);

  if (cachedHealth) {
    setHealthData(cachedHealth);
    setHealthLoading(false);

    try {
      const res = await getWorkspaceMonitorData(id);
      const freshData = Array.isArray(res)
        ? res
        : res?.monitorData || res?.data || [];

      workspaceHealthCache.set(cacheKey, freshData);
      setHealthData(freshData);
    } catch (error) {
      console.error("Health scanner error:", error);
    }

    return;
  }

  setHealthData([]);
  setHealthLoading(true);

  const requestId = ++healthRequestIdRef.current;

  try {
    const res = await getWorkspaceMonitorData(id);

    if (requestId !== healthRequestIdRef.current) return;

    const freshData = Array.isArray(res)
      ? res
      : res?.monitorData || res?.data || [];

    workspaceHealthCache.set(cacheKey, freshData);
    setHealthData(freshData);
  } catch (error) {
    if (requestId === healthRequestIdRef.current) {
      console.error("Health scanner error:", error);
      setHealthData([]);
    }
  } finally {
    if (requestId === healthRequestIdRef.current) {
      setHealthLoading(false);
    }
  }
};

  const healthSummary = useMemo(() => {
    const projects = healthData || [];
    const tasks = projects.flatMap(p => p.tasks || []);
    const completedTasks = tasks.filter(task => norm(task.status) === "completed").length;
    const inProgressTasks = tasks.filter(task => ["in progress", "inprogress", "in-progress"].includes(norm(task.status))).length;
    const overdueTasks = tasks.filter(isOverdue).length;
    const riskyProjects = projects.filter(isRisky).length;

    return {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      completedTasks,
      overdueTasks,
      highPriorityTasks: tasks.filter(task => norm(task.priority) === "high").length,
      // completed = 100%, in progress = 50%
      progress: tasks.length ? Math.round((inProgressTasks * 50 + completedTasks * 100) / tasks.length) : 0,
      riskyProjects,
      status:
        riskyProjects >= Math.max(2, Math.ceil(projects.length / 2))
          ? "Critical"
          : riskyProjects > 0 || overdueTasks > 0
          ? "Needs Attention"
          : "Healthy",
    };
  }, [healthData]);

  useEffect(() => {
  if (!liveTick || !healthWorkspace) return;

  const id = idOf(healthWorkspace);
  if (!id) return;

  const cacheKey = String(id);

  getWorkspaceMonitorData(id)
    .then(res => {
      const freshData = Array.isArray(res)
        ? res
        : res?.monitorData || res?.data || [];

      workspaceHealthCache.set(cacheKey, freshData);
      setHealthData(freshData);
    })
    .catch(error => {
      console.error("Health scanner live update error:", error);
    });
}, [liveTick, healthWorkspace]);

  const getProjectHealth = project => {
    const progress = Number(project.progress || 0);
    const key = (project.tasks || []).some(isOverdue) || progress < 30 ? "risk" : progress < 70 ? "attention" : "healthy";
    const [label, icon, dark, light] = HEALTH[key];
    return { label, icon, className: isDarkMode ? dark : light };
  };

  const filteredWorkspaces = useMemo(() => {
    const search = query.trim().toLowerCase();
    const data = workspaces.filter(ws => (ws.name || "").toLowerCase().includes(search));
    if (SORTS[sortBy]) data.sort(SORTS[sortBy]);
    return data;
  }, [workspaces, query, sortBy]);

  const selectedSort = SORT_OPTIONS.find(([value]) => value === sortBy)?.[1] || "Sort By";

  const noSelection = !activeWorkspace && !allWorkspacesSelected;
  const emptyTitle = noSelection ? "No workspace selected" : query ? "No matching workspaces" : "No workspaces found";
  const emptyText = noSelection
    ? "Select a workspace from the workspace dropdown to view its details."
    : query
    ? "Try a different search term."
    : "Create a workspace to organize your projects and tasks.";


  return (
    <div className={`${PAGE} ${t.page}`}>
      <div className="w-full max-w-7xl mx-auto min-w-0">
        {/* Header */}
        <div className="mb-5 min-[600px]:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">Workspaces</h1>
            <p className={`mt-2 text-xs sm:text-sm break-words ${t.muted}`}>Create, organize, and switch between workspaces.</p>
          </div>
              <div className="w-full sm:w-auto shrink-0 self-start sm:self-auto bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            <PrimaryButton text="+ Create Workspace" onClick={openCreate} />
          </div>
        </div>

        {/* Filters */}
        <div className={`mb-5 min-[600px]:mb-6 w-full max-w-full`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full">
            {/* Search: full width */}
            <div className="relative w-full sm:w-72 md:w-80 xl:w-96 shrink-0">
              <Search size={17} className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${t.icon}`} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search workspaces..."
                className={`w-full h-10 sm:h-11 pl-11 pr-10 rounded-xl border text-sm font-medium outline-none focus:border-blue-500 ${t.surface}`}
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center ${t.clear}`}>
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Mobile: Sort + Health Scanner share one row. Desktop: `contents` keeps the original single row */}
            <div className="grid grid-cols-2 gap-2 sm:contents">
              <div ref={sortRef} className="relative w-full sm:w-48 shrink-0">
                <button
                  type="button"
                  onClick={() => setSortOpen(prev => !prev)}
                  className={`w-full h-10 sm:h-11 pl-9 pr-3 rounded-xl border text-xs sm:text-sm font-medium outline-none flex items-center justify-between gap-2 ${t.surface}`}
                >
                  <SlidersHorizontal size={16} className={`absolute left-3 sm:left-3.5 ${t.icon}`} />
                  <span className="truncate">{selectedSort}</span>
                  <ChevronDown size={14} className={`shrink-0 transition-transform ${t.icon} ${sortOpen ? "rotate-180" : ""}`} />
                </button>

                {sortOpen && (
                  <div className={`absolute left-0 top-full mt-2 z-50 w-48 sm:w-48 rounded-xl border shadow-xl overflow-hidden ${t.surface}`}>
                    <div className="max-h-60 overflow-y-auto">
                      {SORT_OPTIONS.map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setSortBy(value);
                            setSortOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 text-xs sm:text-sm truncate ${sortBy === value ? "bg-blue-600 text-white" : t.option}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => (healthWorkspace ? setHealthWorkspace(null) : filteredWorkspaces.length && openHealthScanner(filteredWorkspaces[0]))}
                className={`h-10 sm:h-11 w-full sm:w-auto sm:ml-auto px-2 sm:px-4 rounded-xl border text-xs sm:text-sm font-semibold whitespace-nowrap truncate ${
                  healthWorkspace ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700" : `${t.surface} ${t.ghost}`
                }`}
              >
                <span className="sm:hidden">Health Scanner</span>
                <span className="hidden sm:inline">Project Health Scanner</span>
              </button>
            </div>

            {/* Grid / List toggle (desktop only) */}
            <div className={`hidden sm:flex items-center rounded-xl border p-1 shrink-0 ${t.surface}`}>
              {[["grid", Grid3X3, "Grid"], ["list", List, "List"]].map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  aria-label={`${label} view`}
                  title={`${label} View`}
                  className={`h-9 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold whitespace-nowrap ${viewMode === mode ? "bg-blue-600 text-white shadow-sm" : t.toggle}`}
                >
                  <Icon size={mode === "list" ? 16 : 15} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Workspace list */}
        {filteredWorkspaces.length ? (
          <div className={viewMode === "grid" ? GRID : LIST}>
            {filteredWorkspaces.map(ws => (
              <div key={idOf(ws)} className="w-full min-w-0 max-w-full">
                <WorkspaceCard
                  workspace={{ ...ws, id: ws._id || ws.id, projectsCount: ws.projectsCount || 0 }}
                  onDelete={() => setWorkspaceToDelete(ws)}
                  onEdit={() => {
                    setEditingWorkspace(ws);
                    setShowModal(true);
                  }}
                  userRole="projectadmin"
                  viewMode={viewMode}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={`min-h-[260px] sm:min-h-[320px] w-full border rounded-2xl shadow-sm flex flex-col items-center justify-center text-center px-4 sm:px-6 py-8 ${t.panel}`}>
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-4 ${t.emptyIcon}`}>
              <BriefcaseBusiness size={24} />
            </div>
            <h3 className={`text-sm font-semibold ${t.title}`}>{emptyTitle}</h3>
            <p className={`mt-1 text-xs max-w-md ${t.hint}`}>{emptyText}</p>
          </div>
        )}
      </div>

      {/* Create / edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/30 backdrop-blur-sm overflow-y-auto">
          <div className="relative z-[110] w-full max-w-lg max-h-[96vh] overflow-y-auto min-w-0">
            <WorkspaceForm onClose={closeForm} onAddWorkspace={addWorkspace} onUpdateWorkspace={updateWorkspace} initialData={editingWorkspace} />
          </div>
        </div>
      )}

      {workspaceToDelete && (
        <DeleteModal ws={workspaceToDelete} busy={isDeleting} t={t} onCancel={() => setWorkspaceToDelete(null)} onConfirm={confirmDeleteWorkspace} />
      )}

      <ProjectHealthScanner
        healthWorkspace={healthWorkspace}
        healthData={healthData}
        healthLoading={healthLoading}
        healthSummary={healthSummary}
        getProjectHealth={getProjectHealth}
        onClose={() => setHealthWorkspace(null)}
      />
    </div>
  );
};

export default ManageWorkspaces;
