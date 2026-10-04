import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FolderOpen, Search, X } from "lucide-react";
import { deleteProject, getDashboardProjects } from "../../services/projectService";
import { getDashboardTasks } from "../../services/taskService";
import ProjectMonitorCard from "../../components/admin/ProjectMonitorCard";
import ProjectForm from "../../components/forms/ProjectForm";
import ProjectDetailModal from "../../components/admin/ProjectDetailModal";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useTheme } from "../../context/ThemeContext";

const PAGE_SIZE = 5;

const getId = value =>
  String(typeof value === "object" ? value?._id : value);

const MonitorProjectsandTasks = () => {
  const liveTick = useLiveTick({ resources: ["projects", "tasks", "workspaces"] });
  const { activeWorkspace } = useWorkspace();
  const { isDarkMode } = useTheme();
  const workspaceId = activeWorkspace?.id;
const requestId = useRef(0);

const cacheKey = workspaceId || "all";
const cachedMonitorData = monitorProjectsCache.get(cacheKey);

const [projects, setProjects] = useState(cachedMonitorData?.projects || []);
const [tasks, setTasks] = useState(cachedMonitorData?.tasks || []);
const [loading, setLoading] = useState(!cachedMonitorData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load project and task data
 const loadData = useCallback(async (silent = false) => {
  const id = ++requestId.current;

  try {
    const cacheKey = workspaceId || "all";
    const cachedData = monitorProjectsCache.get(cacheKey);

    if (!silent && !cachedData) {
      setLoading(true);
    }

    const [pRes, tRes] = await Promise.all([
      getDashboardProjects(workspaceId),
      getDashboardTasks()
    ]);

    if (id !== requestId.current) return;

    const allProjects = Array.isArray(pRes)
      ? pRes
      : pRes?.projects || [];

    const allTasks = Array.isArray(tRes)
      ? tRes
      : tRes?.tasks || [];

    const list = workspaceId
      ? allProjects.filter(
          p => getId(p.workspace) === String(workspaceId)
        )
      : allProjects;

    const ids = new Set(list.map(p => String(p._id)));

    const filteredTasks = allTasks.filter(
      t => ids.has(getId(t.project))
    );

    setProjects(list);
    setTasks(filteredTasks);

    monitorProjectsCache.set(cacheKey, {
      projects: list,
      tasks: filteredTasks
    });
  } catch (err) {
    if (id !== requestId.current) return;

    console.error(err);

    const cachedData = monitorProjectsCache.get(
      workspaceId || "all"
    );

    if (!cachedData) {
      setProjects([]);
      setTasks([]);
    }
  } finally {
    if (id === requestId.current) {
      setLoading(false);
    }
  }
}, [workspaceId]);

  // Calculate project statistics
  const getProjectStats = project => {
    const list = tasks.filter(
      t => getId(t.project) === String(project._id)
    );

    const stats = list.reduce(
      (a, t) => {
        const s = String(t.status || "").toLowerCase().trim();

        if (s === "todo" || s === "to do") a.todo++;
        else if (s === "in progress" || s === "inprogress") a.inProgress++;
        else if (s === "completed") a.completed++;

        return a;
      },
      { todo: 0, inProgress: 0, completed: 0 }
    );

    return {
      ...project,
      ...stats,
      totalTasks: list.length,
      progress: list.length
        ? Math.round(
            (stats.completed * 100 + stats.inProgress * 50) / list.length
          )
        : 0
    };
  };

  // Filter projects
  const filtered = projects.filter(p => {
    const name = String(
      p.projectName || p.name || p.title || ""
    ).toLowerCase();

    const status = String(
      p.status || "Planning"
    ).toLowerCase().trim();

    return (
      name.includes(searchTerm.toLowerCase()) &&
      (statusFilter === "All" ||
        status === statusFilter.toLowerCase())
    );
  });

  useEffect(() => setCurrentPage(1), [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const page = totalPages
    ? Math.min(currentPage, totalPages)
    : 1;

  const visible = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const handleEdit = project => {
    setSelectedProject(project);
    setIsEditMode(true);
    setShowForm(true);
  };

  const handleView = project => {
    setSelectedProject(getProjectStats(project));
    setShowView(true);
  };

  const handleDelete = project => setProjectToDelete(project);

  // Delete project
  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      setIsDeleting(true);

      await deleteProject(projectToDelete._id);

      setProjectToDelete(null);
      loadData();
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
          "Unable to delete project."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const cardBg = isDarkMode
    ? "bg-[#0B1128] border-[#1E293B]"
    : "bg-white border-gray-200";

  const skeleton = isDarkMode
    ? "bg-[#111936]"
    : "bg-gray-200";

  // Loading state
  if (loading) {
    return (
      <div
        className={`min-h-screen px-3 sm:px-5 lg:px-10 pt-4 pb-8 ${
          isDarkMode ? "bg-[#05091D]" : "bg-gray-50"
        }`}
      >
        <div className="space-y-3 mb-6">
          <div
            className={`h-8 max-w-md rounded-lg animate-pulse ${skeleton}`}
          />

          <div
            className={`h-4 max-w-xl rounded animate-pulse ${skeleton}`}
          />

          <div className="flex justify-end gap-2.5">
            <div
              className={`h-10 w-64 rounded-xl animate-pulse ${skeleton}`}
            />

            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`h-10 w-20 rounded-xl animate-pulse ${skeleton}`}
                />
              ))}
            </div>
          </div>
        </div>

        {[1, 2].map(i => (
          <div
            key={i}
            className={`h-52 mb-6 rounded-3xl border p-6 animate-pulse ${cardBg}`}
          >
            <div
              className={`h-5 w-40 rounded mb-5 ${skeleton}`}
            />

            <div
              className={`h-7 w-72 rounded mb-4 ${skeleton}`}
            />

            <div
              className={`h-4 w-full max-w-xl rounded mb-6 ${skeleton}`}
            />

            <div
              className={`h-3 rounded-full ${skeleton}`}
            />
          </div>
        ))}
      </div>
    );
  }

  const noFilter = !searchTerm && statusFilter === "All";

  return (
    <div
      className={`min-h-screen w-full px-3 sm:px-5 lg:px-10 pt-4 pb-10 space-y-2 sm:space-y-3 overflow-x-hidden ${
        isDarkMode ? "bg-[#05091D]" : "bg-gray-50"
      }`}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Monitor Projects and Tasks
        </h1>

        <p
          className={`text-sm mt-1 ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          See how projects and tasks are progressing.
        </p>

        <div className="w-full min-w-0 mt-2 pb-1 lg:-mt-2">
          <div className="flex flex-col gap-2.5 w-full lg:flex-row lg:items-center lg:justify-end">
            <div className="relative w-full sm:w-72 md:w-80 lg:w-80 shrink-0">
              <Search
                size={17}
                className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${
                  isDarkMode
                    ? "text-gray-500"
                    : "text-gray-400"
                }`}
              />

              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search projects..."
                className={`w-full h-10 sm:h-11 pl-11 pr-10 rounded-xl border text-sm font-medium outline-none focus:border-blue-500 ${
                  isDarkMode
                    ? "bg-[#11182B] border-[#263149] text-gray-200 placeholder:text-gray-500"
                    : "bg-white border-gray-200 text-gray-700 placeholder:text-gray-400"
                }`}
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center ${
                    isDarkMode
                      ? "bg-white/10 text-gray-300 hover:bg-white/20"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2.5 w-full lg:flex lg:w-auto">
              {[
                "All",
                "Planning",
                "In Progress",
                "Completed"
              ].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`h-10 sm:h-11 px-1 sm:px-3.5 rounded-xl text-[9px] sm:text-sm font-medium whitespace-nowrap border w-full lg:w-auto ${
                    statusFilter === status
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : isDarkMode
                      ? "bg-[#11182B] border-[#263149] text-gray-400"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {(searchTerm || !noFilter) && (
          <div className="flex justify-end mt-0">
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("All");
              }}
              className="text-sm font-medium text-indigo-500"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 sm:space-y-4">
        {filtered.length ? (
          visible.map(project => (
            <ProjectMonitorCard
              key={project._id}
              project={getProjectStats(project)}
              onView={() => handleView(project)}
              onEdit={() => handleEdit(project)}
              onDelete={() => handleDelete(project)}
            />
          ))
        ) : (
          <div
            className={`min-h-[240px] rounded-2xl border flex flex-col items-center justify-center text-center px-4 ${cardBg}`}
          >
            <div
              className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 ${
                isDarkMode
                  ? "bg-[#111936] border-[#1E293B]"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              <FolderOpen
                size={26}
                className="text-gray-400"
              />
            </div>

            <h3
              className={`font-semibold ${
                isDarkMode
                  ? "text-gray-200"
                  : "text-gray-700"
              }`}
            >
              {noFilter
                ? "No Projects Available"
                : "No Projects Found"}
            </h3>

            <p
              className={`mt-1 text-sm max-w-md ${
                isDarkMode
                  ? "text-gray-500"
                  : "text-gray-400"
              }`}
            >
              {noFilter
                ? "There are no projects in this workspace yet."
                : "No projects match the selected search or status filter."}
            </p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div
          className={`flex justify-center pt-4 border-t ${
            isDarkMode
              ? "border-[#1E293B]"
              : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() =>
                setCurrentPage(p => Math.max(1, p - 1))
              }
              className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                isDarkMode
                  ? "border-[#263149] text-gray-400"
                  : "border-gray-200 text-gray-500"
              }`}
            >
              <ChevronLeft size={17} />
            </button>

            {Array.from(
              { length: totalPages },
              (_, i) => i + 1
            ).map(n => (
              <button
                key={n}
                onClick={() => setCurrentPage(n)}
                className={`w-9 h-9 rounded-lg text-xs font-semibold ${
                  page === n
                    ? "bg-blue-600 text-white"
                    : isDarkMode
                    ? "bg-[#11182B] border border-[#263149] text-gray-400"
                    : "bg-white border border-gray-200 text-gray-600"
                }`}
              >
                {n}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() =>
                setCurrentPage(p =>
                  Math.min(totalPages, p + 1)
                )
              }
              className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                isDarkMode
                  ? "border-[#263149] text-gray-400"
                  : "border-gray-200 text-gray-500"
              }`}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      )}

      {showView && selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setShowView(false)}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl my-auto">
            <ProjectForm
              onClose={() => setShowForm(false)}
              initialData={selectedProject}
              onSubmit={() => {
                setShowForm(false);
                loadData();
              }}
              isEdit={isEditMode}
            />
          </div>
        </div>
      )}

      {projectToDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm">
          <div
            className={`relative w-full max-w-md rounded-2xl border p-5 sm:p-7 shadow-2xl ${cardBg}`}
          >
            <button
              onClick={() =>
                !isDeleting && setProjectToDelete(null)
              }
              disabled={isDeleting}
              className="absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-[#111936]"
            >
              <X size={20} />
            </button>

            <div className="text-center pt-2">
              <h2
                className={`text-xl font-bold ${
                  isDarkMode
                    ? "text-white"
                    : "text-gray-900"
                }`}
              >
                Are you sure?
              </h2>

              <p
                className={`mt-3 text-sm leading-6 ${
                  isDarkMode
                    ? "text-gray-400"
                    : "text-gray-500"
                }`}
              >
                Are you sure you want to delete this project?
                This action cannot be undone.
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() =>
                    !isDeleting &&
                    setProjectToDelete(null)
                  }
                  disabled={isDeleting}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${
                    isDarkMode
                      ? "border-[#263149] text-gray-300"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitorProjectsandTasks;