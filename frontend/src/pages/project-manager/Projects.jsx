import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import {Link, useLocation, useParams, useSearchParams,} from "react-router-dom";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import ProjectForm from "../../components/forms/ProjectForm";
import ProjectCard from "../../components/cards/ProjectCard";
import ManageProjectMembers from "../../components/forms/ManageProjectMembers";
import InviteMemberForm from "../../components/forms/InviteMemberForm";
import InviteButton from "../../components/buttons/InviteButton";
import ProjectControls from "../../components/project/ProjectControls";
import { ArrowLeft, Layers, X, Trash2, AlertTriangle } from "lucide-react";
import {createProject, getProjectsByWorkspace, updateProject, deleteProject,} from "../../services/projectService";
const projectsCache = new Map();
const Projects = () => {
  const liveTick = useLiveTick({ resources: ["projects", "tasks"] });
  const { state } = useLocation();
  const { workspaceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDarkMode } = useTheme();
  const [showManageMembersModal, setShowManageMembersModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const descRef = useRef(null);
  const [showDesc, setShowDesc] = useState(false);
  const [longDesc, setLongDesc] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);
  const currentWorkspaceId = state?.id || state?._id || workspaceId || activeWorkspace?.id || activeWorkspace?._id;
  const cacheKey = currentWorkspaceId || "all";
  const cachedProjects = projectsCache.get(cacheKey);
  const [projects, setProjects] = useState(cachedProjects || []);
  const [viewMode, setViewMode] = useState("grid");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    try {
      const savedWorkspace = localStorage.getItem("activeWorkspace");
      if (savedWorkspace) setActiveWorkspace(JSON.parse(savedWorkspace));
    } catch (error) {
      console.error("Error reading active workspace:", error);
      setActiveWorkspace(null);
    }
  }, []);

  const workspaceName = state?.name || activeWorkspace?.name || activeWorkspace?.workspaceName || "Workspace";
  const workspaceDesc = state?.description || activeWorkspace?.description || "No description available.";

  useEffect(() => {
    setShowDesc(false);
    const check = () => {
      const el = descRef.current;
      if (el) setLongDesc(el.scrollHeight > parseFloat(getComputedStyle(el).lineHeight) + 2);
    };
    const timer = setTimeout(check);
    window.addEventListener("resize", check);
    return () => { clearTimeout(timer); window.removeEventListener("resize", check); };
  }, [workspaceDesc]);

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setEditingProject(null); setShowModal(true);
      const updatedParams = new URLSearchParams(searchParams);
      updatedParams.delete("create"); setSearchParams(updatedParams, { replace: true });
    }
    if (searchParams.get("invite") === "true") {
      setShowInviteModal(true);
      const updatedParams = new URLSearchParams(searchParams);
      updatedParams.delete("invite"); setSearchParams(updatedParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!currentWorkspaceId) { setProjects([]); setLoading(false); return; }
    const cacheKey = currentWorkspaceId;
    const cachedData = projectsCache.get(cacheKey);
    if (cachedData) {
      setProjects(cachedData);
      setLoading(false);
      getProjectsByWorkspace(currentWorkspaceId).then(response => {
        const nextProjects = response?.projects ?? (Array.isArray(response) ? response : []);
        projectsCache.set(cacheKey, nextProjects); setProjects(nextProjects);
      }).catch(error => console.error("Error refreshing projects:", error));
      return;
    }
    setLoading(true);
    getProjectsByWorkspace(currentWorkspaceId).then(response => {
      const nextProjects = response?.projects ?? (Array.isArray(response) ? response : []);
      projectsCache.set(cacheKey, nextProjects); setProjects(nextProjects);
    }).catch(error => {
      console.error("Error fetching projects:", error); setProjects([]);
    }).finally(() => setLoading(false));
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (!liveTick || !currentWorkspaceId) return;
    getProjectsByWorkspace(currentWorkspaceId).then(response => {
      const nextProjects = response?.projects ?? (Array.isArray(response) ? response : []);
      projectsCache.set(currentWorkspaceId, nextProjects); setProjects(nextProjects);
    }).catch(error => console.error("Error refreshing projects:", error));
  }, [liveTick, currentWorkspaceId]);

  const fetchWorkspaceProjects = async () => {
    if (!currentWorkspaceId) return;
    try {
      const response = await getProjectsByWorkspace(currentWorkspaceId);
      const nextProjects = response?.projects ?? (Array.isArray(response) ? response : []);
      projectsCache.set(currentWorkspaceId, nextProjects); setProjects(nextProjects);
    } catch (error) { console.error("Error fetching projects:", error); setProjects([]); }
  };

  const handleFormSubmit = async data => {
    try {
      if (editingProject) {
        const projectId = editingProject._id || editingProject.id;
        const response = await updateProject(projectId, data);
        const updatedProject = response.project || response;
        setProjects(prevProjects => prevProjects.map(project => (project._id || project.id) === projectId ? { ...project, ...updatedProject } : project));
      } else {
        const response = await createProject({ ...data, workspaceId: currentWorkspaceId });
        const newProject = response.project || response;
        setProjects(prevProjects => [newProject, ...prevProjects]);
      }
      fetchWorkspaceProjects(); return true;
    } catch (error) {
      console.error("Error handling project submit:", error);
      if (error.response?.status === 409) { alert(error.response.data.message); return false; }
      alert(error.response?.data?.message || "Project name already exists."); return false;
    }
  };

  const deleteProjectData = (projectId, tasksCount, projectName) => {
    setDeleteError(""); setDeleteTarget({ id: projectId, tasksCount, name: projectName || "this project" }); setShowDeleteModal(true);
  };
  const confirmDeleteProject = async () => {
    if (!deleteTarget || deleteTarget.tasksCount > 0) return;
    setIsDeleting(true); setDeleteError("");
    try {
      await deleteProject(deleteTarget.id);
      setProjects(prevProjects => prevProjects.filter(project => (project._id || project.id) !== deleteTarget.id));
      setShowDeleteModal(false); setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting project:", error); setDeleteError(error?.response?.data?.message || "Request failed.");
    } finally { setIsDeleting(false); }
  };
  const handleEdit = project => { setEditingProject(project); setShowModal(true); };
  const handleManageMembers = projectId => { setSelectedProjectId(projectId); setShowManageMembersModal(true); };

  const getProcessedProjects = () => {
    let result = [...projects];
    if (searchQuery.trim() !== "") result = result.filter(project => (project.projectName || project.title || "").toLowerCase().includes(searchQuery.toLowerCase()));
    if (!sortBy) return result;
    return result.sort((a, b) => {
      const getStatusTargetMatch = idString => {
        if (idString === "inprogress") return "In Progress";
        if (idString === "planning") return "Planning";
        if (idString === "onhold") return "On Hold";
        if (idString === "completed") return "Completed";
        if (idString === "cancelled") return "Cancelled";
        return null;
      };
      const targetStatus = getStatusTargetMatch(sortBy);
      if (targetStatus) {
        const statusA = (a.status || "Planning") === targetStatus ? 1 : 0;
        const statusB = (b.status || "Planning") === targetStatus ? 1 : 0;
        return statusB - statusA;
      }
      if (sortBy === "newest") return new Date(b.createdAt || b._id || b.date) - new Date(a.createdAt || a._id || a.date);
      if (sortBy === "oldest") return new Date(a.createdAt || a._id || a.date) - new Date(b.createdAt || b._id || b.date);
      return 0;
    });
  };
  const processedProjects = getProcessedProjects();
  const paginatedProjects = processedProjects.slice(0, visibleCount);

  const Skeleton = ({ className = "" }) => <div className={`animate-pulse rounded bg-gray-200 dark:bg-slate-800 ${className}`} />;

  return (
    <div className="w-full min-h-screen flex flex-col pt-0 px-4 sm:px-6 pb-6 max-w-7xl mx-auto space-y-5 text-gray-900 dark:text-white bg-transparent transition-colors duration-200 relative overflow-visible">
      <div className="pt-4 pb-3 space-y-3 shrink-0">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-start space-x-3 sm:space-x-4 min-w-0 flex-1 w-full">
            <Link to="/project-manager/workspaces" className="mt-1 p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all shadow-sm shrink-0 active:scale-90 flex items-center justify-center">
              <ArrowLeft size={18} className="text-gray-600 dark:text-slate-400" />
            </Link>
            <div className="min-w-0 mt-1 pr-2">
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-800"}`}>{workspaceName}</h1>
              <p ref={descRef} className={`text-xs sm:text-sm mt-1 pr-2 break-words ${isDarkMode ? "text-gray-400" : "text-gray-500"} ${showDesc ? "" : "line-clamp-1"}`}>{workspaceDesc}</p>
              {longDesc && <button type="button" onClick={() => setShowDesc(v => !v)} className="text-xs font-semibold text-blue-600 mt-1">{showDesc ? "Show Less" : "Show More"}</button>}
            </div>
          </div>
          {loading ? (
            <div className="flex flex-row items-stretch gap-2.5 w-full lg:w-auto shrink-0 self-start lg:self-start lg:mt-7">
              <Skeleton className="h-11 flex-1 lg:w-32 lg:flex-none rounded-lg" />
              <Skeleton className="h-11 flex-[1.3] lg:w-44 lg:flex-none rounded-lg" />
            </div>
          ) : (
            <div className="flex flex-row items-stretch gap-2.5 w-full lg:w-auto shrink-0 self-start lg:self-start lg:mt-7">
              <div className="flex-1 lg:flex-none lg:w-32 [&>button]:w-full [&>button]:h-full [&>button]:py-2.5"><InviteButton onClick={() => setShowInviteModal(true)} /></div>
              <div className="bg-indigo-600 hover:bg-indigo-700 flex-[1.3] lg:flex-none lg:w-44 shrink-0 rounded-lg flex items-center justify-center"><div className="w-full h-full [&>button]:w-full [&>button]:h-full [&>button]:py-2.5 [&>button]:whitespace-nowrap [&>button]:px-3"><PrimaryButton text="+ Create Project" onClick={() => { setEditingProject(null); setShowModal(true); }} /></div></div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="w-full flex flex-col lg:flex-row gap-3 items-stretch">
            <Skeleton className="h-11 flex-1 min-w-0 rounded-xl" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:w-auto lg:min-w-[390px]">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl col-span-2 sm:col-span-1" />
            </div>
          </div>
        ) : (
          <ProjectControls searchQuery={searchQuery} setSearchQuery={setSearchQuery} sortBy={sortBy} setSortBy={setSortBy} viewMode={viewMode} setViewMode={setViewMode} />
        )}
      </div>

      <div className="w-full pt-2">
        {loading ? (
          <div className="w-full">
            {viewMode === "list" ? (
              <div className="flex flex-col gap-4 pb-6 w-full">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="w-full rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 animate-pulse"><div className="flex gap-4 items-center"><Skeleton className="w-20 h-20 rounded-xl shrink-0" /><div className="flex-1 space-y-3"><Skeleton className="h-5 w-1/3" /><Skeleton className="h-3 w-2/3" /><Skeleton className="h-3 w-1/2" /></div><Skeleton className="h-9 w-24 rounded-lg" /></div></div>)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 pb-6 w-full">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="w-full min-h-[250px] rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 animate-pulse"><div className="flex items-center justify-between mb-5"><Skeleton className="h-11 w-11 rounded-xl" /><Skeleton className="h-7 w-20 rounded-lg" /></div><Skeleton className="h-5 w-3/5 mb-3" /><Skeleton className="h-3 w-full mb-2" /><Skeleton className="h-3 w-4/5 mb-6" /><div className="grid grid-cols-2 gap-3"><Skeleton className="h-12 rounded-lg" /><Skeleton className="h-12 rounded-lg" /></div><Skeleton className="h-2 w-full rounded-full mt-5" /></div>)}
              </div>
            )}
          </div>
        ) : paginatedProjects.length > 0 ? (
          <div className="flex flex-col items-center">
            <div className={viewMode === "list" ? "flex flex-col gap-4 pb-6 w-full min-w-0" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 pb-6 w-full"}>
              {paginatedProjects.map(project => {
                const projectId = project._id || project.id;
                const tasksCount = project.tasksCount || 0;
                const completedTasks = project.completedTasks || 0;
                return <ProjectCard key={projectId} project={{ ...project, tasksCount, completedTasks }} userRole="projectmanager" onEdit={() => handleEdit(project)} onDelete={() => deleteProjectData(projectId, tasksCount, project.projectName || project.title)} onManageMembers={() => handleManageMembers(projectId)} viewMode={viewMode} />;
              })}
            </div>
            {processedProjects.length > visibleCount && <button onClick={() => setVisibleCount(prev => prev + 6)} className="mt-4 px-6 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all text-slate-700 dark:text-slate-300">Load More Projects</button>}
          </div>
        ) : (
          <div className="h-[300px] sm:h-[350px] border border-dashed border-gray-200 dark:border-slate-800/80 rounded-[2rem] flex flex-col items-center justify-center p-6 text-center bg-white/40 dark:bg-[#11182B]/40 transition-all duration-500">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800/60 rounded-2xl flex items-center justify-center mb-4 shadow-sm text-indigo-600 dark:text-indigo-400"><Layers size={20} className="stroke-[1.5]" /></div>
            <h3 className="text-gray-700 dark:text-gray-200 text-sm font-bold tracking-tight mb-1">No Active Projects Found</h3>
            <p className="text-gray-400 dark:text-slate-500 text-[11px] font-medium max-w-sm leading-relaxed">You don't have any Project yet. Click on "Create Project" to create your first Project.</p>
          </div>
        )}
      </div>

      {showModal && <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"><div className="relative z-[110] w-full max-w-lg max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2rem)] overflow-y-auto"><ProjectForm onClose={() => { setShowModal(false); setEditingProject(null); }} onSubmit={handleFormSubmit} initialData={editingProject} hideCompletedStatus /></div></div>}
      {showInviteModal && <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} /><div className="relative z-[110] w-full max-w-md"><InviteMemberForm onClose={() => setShowInviteModal(false)} userRole="Project Manager" workspaceId={currentWorkspaceId} /></div></div>}
      {showDeleteModal && deleteTarget && <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { if (!isDeleting) { setShowDeleteModal(false); setDeleteTarget(null); setDeleteError(""); } }}><div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-5 sm:p-6" onClick={event => event.stopPropagation()}><button type="button" onClick={() => { if (!isDeleting) { setShowDeleteModal(false); setDeleteTarget(null); setDeleteError(""); } }} className="absolute top-3 right-3 p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition" aria-label="Close" disabled={isDeleting}><X size={18} /></button><div className="flex items-start gap-3 pr-8"><div className="w-11 h-11 shrink-0 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">{deleteTarget.tasksCount > 0 ? <AlertTriangle size={22} /> : <Trash2 size={21} />}</div><div className="min-w-0"><h3 className="text-lg font-bold text-slate-900 dark:text-white">{deleteTarget.tasksCount > 0 ? "Project cannot be deleted" : "Delete project?"}</h3><p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{deleteTarget.tasksCount > 0 ? `"${deleteTarget.name}" has ${deleteTarget.tasksCount} task${deleteTarget.tasksCount === 1 ? "" : "s"}. Remove all tasks before deleting this project.` : `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}</p></div></div>{deleteError && <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-3 py-2.5 text-sm font-medium text-red-700 dark:text-red-300">{deleteError}</div>}<div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5"><button type="button" onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); setDeleteError(""); }} disabled={isDeleting} className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50">Cancel</button>{deleteTarget.tasksCount > 0 ? <Link to={`/project-manager/workspaces/${currentWorkspaceId}/projects/${deleteTarget.id}`} onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); setDeleteError(""); }} className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition">Open Tasks</Link> : <button type="button" onClick={confirmDeleteProject} disabled={isDeleting} className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition disabled:opacity-50">{isDeleting ? "Deleting..." : "Delete Project"}</button>}</div></div></div>}
      {showManageMembersModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150" onClick={() => setShowManageMembersModal(false)} /><div className="relative z-50 w-full max-w-md flex items-center justify-center"><ManageProjectMembers projectId={selectedProjectId} onClose={() => setShowManageMembersModal(false)} onSaved={fetchWorkspaceProjects} /></div></div>}
    </div>
  );
};
export default Projects;
