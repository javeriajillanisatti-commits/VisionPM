import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  X,
  ChevronDown,
} from "lucide-react";
import TaskCard from "../../components/cards/TaskCard";
import TaskInsights from "../../components/admin/TaskInsights";
import { useTheme } from "../../context/ThemeContext";

const adminTasksCache = new Map();
const AdminTasks = () => {
  const liveTick = useLiveTick({ resources: ["tasks", "projects"] });
  const { projectId } = useParams();
  const { isDarkMode } = useTheme();
  const token = sessionStorage.getItem("token");

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnceRef = useRef(false);
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [showTaskInsights, setShowTaskInsights] = useState(false);
  const descriptionRef = useRef(null);
  const [hasMoreDescription, setHasMoreDescription] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const apiConfig = useMemo(
  () => ({ headers: { Authorization: `Bearer ${token}` } }),
  [token]
);
  const perPage = 9;

  const fetchProject = useCallback(async () => {
  if (!token || !projectId) {
    setProject(null);
    return;
  }

  try {
    const { data } = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/projects/${projectId}`,
      apiConfig
    );

    setProject(data?.project || data?.data || data || null);
  } catch (error) {
    console.error("Error fetching project:", error.response?.data || error);
    setProject(null);
  }
}, [token, projectId, apiConfig]);

 const fetchTasks = useCallback(async () => {
  if (!token) {
    console.error("No authentication token found.");
    setTasks([]);
    setLoading(false);
    return;
  }

  try {
    const cacheKey = projectId;
    const cachedData = adminTasksCache.get(cacheKey);

    if (!hasLoadedOnceRef.current && !cachedData) {
      setLoading(true);
    }

    const { data } = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/tasks/project/${projectId}`,
      apiConfig
    );

    const list = data?.tasks || data || [];
    const freshProject = list[0]?.project;

    setTasks(list);

    if (freshProject && typeof freshProject === "object") {
      setProject(current => current || freshProject);
    }

    adminTasksCache.set(cacheKey, {
      tasks: list,
      project: freshProject && typeof freshProject === "object"
        ? freshProject
        : null,
    });

    setCurrentPage(1);
  } catch (error) {
    console.error("Error fetching tasks:", error.response?.data || error);

    const cachedData = adminTasksCache.get(projectId);

    if (cachedData) {
      setTasks(cachedData.tasks);
      if (cachedData.project) {
        setProject(cachedData.project);
      }
    } else {
      setTasks([]);
    }
  } finally {
    setLoading(false);
    hasLoadedOnceRef.current = true;
  }
}, [token, projectId, apiConfig]);

  useEffect(() => {
  if (!projectId) {
    setTasks([]);
    setProject(null);
    setLoading(false);
    return;
  }

  const cachedData = adminTasksCache.get(projectId);

  if (cachedData) {
    setTasks(cachedData.tasks);

    if (cachedData.project) {
      setProject(cachedData.project);
    }

    setLoading(false);
    hasLoadedOnceRef.current = true;
  }

  fetchProject();
  fetchTasks();
}, [projectId, fetchProject, fetchTasks]);

useEffect(() => {
  if (!liveTick || !projectId) return;

  fetchTasks();
}, [liveTick, projectId, fetchTasks]);

  useEffect(() => setCurrentPage(1), [searchTerm, sortBy, viewMode]);

  const sortedTasks = useMemo(() => {
    const priority = { High: 3, Medium: 2, Low: 1 };
    const date = (a, b, field) =>
      new Date(a[field] || 0) - new Date(b[field] || 0);

    const list = tasks.filter(task =>
      String(task.taskTitle || task.title || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return date(b, a, "createdAt");
        case "oldest":
          return date(a, b, "createdAt");
        case "priorityHigh":
          return (priority[b.priority] || 0) - (priority[a.priority] || 0);
        case "priorityLow":
          return (priority[a.priority] || 0) - (priority[b.priority] || 0);
        case "dueNear":
          return date(a, b, "dueDate");
        case "dueFar":
          return date(b, a, "dueDate");
        default:
          return 0;
      }
    });
  }, [tasks, searchTerm, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedTasks.length / perPage));
  const pageTasks = sortedTasks.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const projectName = project?.projectName || project?.name || "Project Tasks";
  const description =
    project?.description || "Overview of tasks in this project.";

  useEffect(() => {
    const checkDescription = () => {
      if (descriptionRef.current) {
        setHasMoreDescription(
          descriptionRef.current.scrollHeight >
            descriptionRef.current.clientHeight + 1
        );
      }
    };

    checkDescription();
    window.addEventListener("resize", checkDescription);
    return () => window.removeEventListener("resize", checkDescription);
  }, [description]);

  const goToPage = page => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pages = useMemo(() => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2)
      return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
    return Array.from({ length: 5 }, (_, i) => currentPage - 2 + i);
  }, [currentPage, totalPages]);

  const panel = isDarkMode
    ? "bg-[#11182B] border-[#263149]"
    : "bg-white border-gray-200";

  const selectClass = `w-full min-w-0 max-w-full h-10 sm:h-11 rounded-xl border text-sm font-medium outline-none focus:border-blue-500 ${
    isDarkMode
      ? "bg-[#11182B] border-[#263149] text-gray-200"
      : "bg-white border-gray-200 text-gray-700"
  }`;

  const viewButtons = [
    ["grid", Grid3X3, "Grid"],
    ["list", List, "List"],
  ];

  return (
    <div
      className={`w-full min-w-0 min-h-screen px-3 min-[430px]:px-4 sm:px-6 lg:px-10 pt-3 min-[430px]:pt-4 pb-4 sm:pb-6 lg:pb-10 space-y-5 min-[600px]:space-y-6 overflow-x-hidden ${
        isDarkMode ? "bg-[#05091D] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="flex items-start gap-2.5 min-[430px]:gap-4 min-w-0">
        <button
          type="button"
          onClick={() => window.history.back()}
          className={`w-9 h-9 min-[430px]:w-11 min-[430px]:h-11 border rounded-xl shrink-0 flex items-center justify-center ${panel}`}
        >
          <ArrowLeft size={17} />
        </button>

        <div className="min-w-0">
          <h1
            className={`text-2xl sm:text-3xl font-bold tracking-tight break-words ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {projectName}
          </h1>

          <div className="mt-1.5 min-[430px]:mt-2 w-full">
            <p
              ref={descriptionRef}
              className={`text-xs min-[430px]:text-sm leading-relaxed break-words ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              } ${!showFullDescription ? "line-clamp-1" : ""}`}
            >
              {description}
            </p>

            {hasMoreDescription && (
              <button
                type="button"
                onClick={() => setShowFullDescription(v => !v)}
                className={`text-[11px] min-[430px]:text-xs font-semibold ${
                  isDarkMode ? "text-blue-400" : "text-blue-600"
                }`}
              >
                {showFullDescription ? "Show Less" : "Show More"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-full">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 w-full">
          <div className="relative w-full sm:w-80 md:w-96">
            <Search
              size={17}
              className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            />

            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search tasks..."
              className={`w-full h-10 sm:h-11 pl-11 pr-10 rounded-xl border text-sm outline-none focus:border-blue-500 ${
                isDarkMode
                  ? "bg-[#11182B] border-[#263149] text-gray-200 placeholder:text-gray-500"
                  : "bg-white border-gray-200 text-gray-700 placeholder:text-gray-400"
              }`}
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center ${
                  isDarkMode
                    ? "bg-white/10 text-gray-300"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:contents">
            <div className="relative w-full min-[430px]:w-52 max-w-full min-w-0 shrink-0">
              <SlidersHorizontal
                size={16}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 z-10 ${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                }`}
              />

              <button
                type="button"
                onClick={() => setShowSortDropdown(v => !v)}
                className={`${selectClass} appearance-none pl-9 pr-9 text-left whitespace-nowrap`}
              >
                {{
                  "": "Sort By",
                  newest: "Newest First",
                  oldest: "Oldest First",
                  priorityHigh: "Priority: High → Low",
                  priorityLow: "Priority: Low → High",
                  dueNear: "Due Date: Nearest",
                  dueFar: "Due Date: Farthest",
                }[sortBy]}
              </button>

              <ChevronDown
                size={14}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                }`}
              />

              {showSortDropdown && (
                <div
                  className={`absolute z-50 mt-1 w-full rounded-xl border shadow-lg overflow-hidden ${
                    isDarkMode
                      ? "bg-[#11182B] border-[#263149]"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {[
                    ["", "Sort By"],
                    ["newest", "Newest First"],
                    ["oldest", "Oldest First"],
                    ["priorityHigh", "Priority: High → Low"],
                    ["priorityLow", "Priority: Low → High"],
                    ["dueNear", "Due Date: Nearest"],
                    ["dueFar", "Due Date: Farthest"],
                  ].map(([value, label]) => (
                    <button
                      key={value || "default"}
                      type="button"
                      onClick={() => {
                        setSortBy(value);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm ${
                        sortBy === value
                          ? "bg-blue-600 text-white"
                          : isDarkMode
                          ? "text-gray-300 hover:bg-[#1B253B]"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full sm:w-auto sm:ml-auto whitespace-nowrap">
              <button
                type="button"
                onClick={() => setShowTaskInsights(true)}
                className={`h-10 sm:h-11 px-4 w-full sm:w-auto rounded-xl border text-sm font-semibold whitespace-nowrap ${
                  showTaskInsights
                    ? "bg-blue-600 border-blue-600 text-white"
                    : panel
                }`}
              >
                Task Insights
              </button>
            </div>

            <div
              className={`hidden sm:flex items-center rounded-xl border p-1 ${panel}`}
            >
              {viewButtons.map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`h-8 sm:h-9 px-3 sm:px-4 rounded-lg flex items-center gap-1.5 text-xs font-semibold ${
                    viewMode === mode
                      ? "bg-blue-600 text-white"
                      : isDarkMode
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 w-full">
        {loading ? (
          <div
            className={`grid grid-cols-1 ${
              viewMode === "grid"
                ? "min-[600px]:grid-cols-2 xl:grid-cols-3"
                : ""
            } gap-4 min-[430px]:gap-5 sm:gap-6 pb-6`}
          >
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className={`h-48 rounded-2xl border animate-pulse ${panel}`}
              />
            ))}
          </div>
        ) : sortedTasks.length ? (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 min-[600px]:grid-cols-2 xl:grid-cols-3 gap-4 min-[430px]:gap-5 sm:gap-8 pb-6"
                  : "flex flex-col gap-3 min-[430px]:gap-4 pb-6"
              }
            >
              {pageTasks.map(task => (
                <div
                  key={task._id || task.id}
                  className="w-full min-w-0 overflow-hidden"
                >
                  <TaskCard
                    task={{ ...task, id: task._id || task.id }}
                    userRole="projectadmin"
                    viewMode={viewMode}
                  />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mb-4 overflow-x-auto">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                    currentPage === 1
                      ? "opacity-40 cursor-not-allowed"
                      : panel
                  }`}
                >
                  <ChevronLeft size={17} />
                </button>

                {pages.map(page => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => goToPage(page)}
                    className={`w-9 h-9 rounded-lg border text-xs font-bold ${
                      currentPage === page
                        ? "bg-blue-600 border-blue-600 text-white"
                        : panel
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                    currentPage === totalPages
                      ? "opacity-40 cursor-not-allowed"
                      : panel
                  }`}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div
            className={`w-full h-[260px] min-[430px]:h-[300px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-6 text-center ${
              isDarkMode
                ? "border-[#263149] bg-[#11182B]/60"
                : "border-gray-300 bg-white"
            }`}
          >
            <div className="text-4xl mb-4 opacity-40">📝</div>

            <h3
              className={`font-bold text-lg ${
                isDarkMode ? "text-gray-300" : "text-gray-800"
              }`}
            >
              No Tasks Found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              {searchTerm
                ? "No tasks match your search."
                : "Tasks created for this project will automatically appear here."}
            </p>
          </div>
        )}
      </div>

      <TaskInsights
        tasks={tasks}
        project={project}
        isDarkMode={isDarkMode}
        open={showTaskInsights}
        onClose={() => setShowTaskInsights(false)}
      />
    </div>
  );
};

export default AdminTasks;
