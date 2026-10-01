import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft, FolderKanban, ListTodo, ChevronDown, ChevronRight,
  ChevronLeft, User, Search, Filter, X
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const PAGE_SIZE = 5;

const WorkspaceProjectMap = () => {
  const { state = {} } = useLocation();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { id: workspaceId, name = "Workspace", description = "" } = state;

  const [projects, setProjects] = useState([]);
  const [expandedProject, setExpandedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDescription, setShowDescription] = useState(false);
  const descriptionRef = useRef(null);
  const [hasMoreDescription, setHasMoreDescription] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!workspaceId) {
        setError("Workspace ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const token = sessionStorage.getItem("token");
        const { data } = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/workspaces/${workspaceId}/project-map`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProjects(data?.mapData?.projects || []);
      } catch (err) {
        console.error("Workspace Project Map Fetch Error:", err);
        setError(err.response?.data?.message || "Failed to load workspace project map.");
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [workspaceId]);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedProject(null);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const checkDescription = () => {
      if (descriptionRef.current) {
        setHasMoreDescription(
          descriptionRef.current.scrollWidth > descriptionRef.current.clientWidth + 1
        );
      }
    };
    checkDescription();
    window.addEventListener("resize", checkDescription);
    return () => window.removeEventListener("resize", checkDescription);
  }, [description]);

  const normalizeStatus = status => {
    const value = String(status || "Planning").trim().toLowerCase();
    if (["inprogress", "in progress"].includes(value)) return "In Progress";
    if (value === "completed") return "Completed";
    if (value === "planning") return "Planning";
    return status;
  };

  const statusStyle = (status, project = false) => {
    const styles = project
      ? {
          Completed: [
            "bg-green-950/40 text-green-400 border-green-900/50",
            "bg-green-50 text-green-600 border-green-200"
          ],
          "In Progress": [
            "bg-indigo-950/40 text-indigo-400 border-indigo-900/50",
            "bg-indigo-50 text-indigo-600 border-indigo-200"
          ],
          Planning: [
            "bg-slate-800 text-slate-400 border-slate-700",
            "bg-gray-100 text-gray-600 border-gray-200"
          ]
        }
      : {
          Completed: ["text-green-400", "text-green-600"],
          "In Progress": ["text-indigo-400", "text-indigo-600"],
          Todo: ["text-slate-400", "text-gray-500"],
          "To Do": ["text-slate-400", "text-gray-500"]
        };

    const [dark, light] = styles[normalizeStatus(status)] || styles.Planning || styles.Todo;
    return isDarkMode ? dark : light;
  };

  const priorityStyle = priority => {
    const styles = {
      High: [
        "bg-red-950/40 text-red-400 border-red-900/50",
        "bg-red-50 text-red-600 border-red-200"
      ],
      Medium: [
        "bg-amber-950/40 text-amber-400 border-amber-900/50",
        "bg-amber-50 text-amber-600 border-amber-200"
      ],
      Low: [
        "bg-green-950/40 text-green-400 border-green-900/50",
        "bg-green-50 text-green-600 border-green-200"
      ]
    };

    const [dark, light] = styles[priority] || [
      "bg-slate-800 text-slate-400 border-slate-700",
      "bg-gray-100 text-gray-500 border-gray-200"
    ];
    return isDarkMode ? dark : light;
  };

  const filtered = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return projects.filter(project => {
      const title = String(project.name || project.projectName || "").toLowerCase();
      const status = normalizeStatus(project.status);
      return (!search || title.includes(search)) &&
        (statusFilter === "All" || status === statusFilter);
    });
  }, [projects, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const page = totalPages ? Math.min(currentPage, totalPages) : 1;
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = searchTerm.trim() || statusFilter !== "All";

  const changePage = value => {
    setCurrentPage(value);
    setExpandedProject(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-3 sm:p-4 md:p-6 ${isDarkMode ? "bg-slate-950" : "bg-gray-50"}`}>
        <div className={`max-w-[1450px] mx-auto border rounded-2xl sm:rounded-3xl p-10 text-center ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
        }`}>
          <p className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
            Loading workspace project map...
          </p>
        </div>
      </div>
    );
  }

  const inputStyle = isDarkMode
    ? "bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/60"
    : "bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-indigo-400";

  return (
    <div className={`min-h-screen p-2.5 xs:p-3 sm:p-4 md:p-6 overflow-x-hidden ${
      isDarkMode ? "bg-slate-950" : "bg-gray-50"
    }`}>
      <div className="max-w-[1450px] mx-auto w-full min-w-0">
        <div className="flex gap-2.5 sm:gap-4 mb-5 sm:mb-7 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center shrink-0 ${
              isDarkMode
                ? "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            <ArrowLeft size={20} />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className={`text-lg xs:text-xl sm:text-2xl font-bold break-words ${
              isDarkMode ? "text-slate-100" : "text-gray-900"
            }`}>
              Workspace <span className={isDarkMode ? "text-indigo-400" : "text-indigo-600"}>
                Project Map
              </span>
            </h1>

            <div className="flex flex-col min-[430px]:flex-row gap-1 min-[430px]:gap-2 min-w-0">
              <p className={`text-sm font-medium break-words ${
                isDarkMode ? "text-slate-300" : "text-gray-700"
              }`}>
                {name}
              </p>

              {description && (
                <div className="min-w-0 max-w-full">
                  <p
                    ref={descriptionRef}
                    className={`text-sm ${
                      showDescription
                        ? "break-words whitespace-normal"
                        : "whitespace-nowrap overflow-hidden text-ellipsis"
                    } ${isDarkMode ? "text-slate-500" : "text-gray-500"}`}
                  >
                    • {description}
                  </p>

                  {hasMoreDescription && (
                    <button
                      onClick={() => setShowDescription(!showDescription)}
                      className={`text-xs font-semibold mt-1 ${
                        isDarkMode ? "text-indigo-400" : "text-indigo-600"
                      }`}
                    >
                      {showDescription ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {error ? (
          <div className={`p-5 rounded-2xl border ${
            isDarkMode
              ? "bg-red-950/30 border-red-900/50 text-red-400"
              : "bg-red-50 border-red-200 text-red-600"
          }`}>
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : (
          <div className={`border rounded-2xl sm:rounded-3xl p-2.5 xs:p-3 sm:p-5 md:p-8 min-w-0 ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
          }`}>
            <div className="mb-5 sm:mb-7">
              <h2 className={`text-base sm:text-lg font-bold ${
                isDarkMode ? "text-slate-100" : "text-gray-900"
              }`}>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  isDarkMode ? "bg-indigo-400" : "bg-indigo-500"
                }`} />
                Workspace Structure
              </h2>

              <p className={`text-xs ml-4 ${
                isDarkMode ? "text-slate-500" : "text-gray-500"
              }`}>
                Select a project to explore its tasks
              </p>
            </div>

            <div className={`max-w-[450px] w-full mx-auto p-4 sm:p-6 rounded-2xl border text-center ${
              isDarkMode ? "bg-indigo-950/30 border-indigo-900/50" : "bg-indigo-50/70 border-indigo-100"
            }`}>
              <div className={`w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 rounded-xl flex items-center justify-center border ${
                isDarkMode ? "bg-slate-900 border-indigo-900/50" : "bg-white border-indigo-100"
              }`}>
                <FolderKanban size={25} className={isDarkMode ? "text-indigo-400" : "text-indigo-600"} />
              </div>

              <h2 className={`font-bold break-words ${
                isDarkMode ? "text-slate-100" : "text-gray-900"
              }`}>
                {name}
              </h2>

              <p className={`text-sm mt-1 ${
                isDarkMode ? "text-indigo-400" : "text-indigo-600"
              }`}>
                {projects.length} {projects.length === 1 ? "Project" : "Projects"}
              </p>
            </div>

            {projects.length > 0 && (
              <>
                <div className={`w-px h-7 mx-auto ${
                  isDarkMode ? "bg-slate-700" : "bg-gray-300"
                }`} />

               <div className={`mb-5 sm:mb-6 p-0 sm:p-4 sm:border sm:rounded-2xl ${
                   isDarkMode ? "sm:bg-slate-950/60 sm:border-slate-800" : "sm:bg-gray-50/70 sm:border-gray-200"
                }`}>
                  <div className="flex flex-col lg:flex-row gap-3">
                    <div className="relative flex-1 w-full min-w-0">
                      <Search
                        size={17}
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                          isDarkMode ? "text-slate-500" : "text-gray-400"
                        }`}
                      />

                      <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search project..."
                        className={`w-full h-10 sm:h-11 pl-10 pr-10 rounded-xl border text-sm outline-none ${inputStyle}`}
                      />

                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                            isDarkMode ? "text-slate-500" : "text-gray-400"
                          }`}
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>

                    <div className="relative w-full lg:w-[220px] shrink-0">
                      <Filter
                        size={16}
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 z-10 ${
                          isDarkMode ? "text-slate-500" : "text-gray-400"
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() => setShowStatusDropdown(v => !v)}
                        className={`w-full h-10 sm:h-11 pl-10 pr-9 rounded-xl border text-sm font-medium outline-none text-left ${inputStyle}`}
                      >
                        {statusFilter}
                      </button>

                      <ChevronDown
                        size={15}
                        className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                          isDarkMode ? "text-slate-500" : "text-gray-400"
                        }`}
                      />

                      {showStatusDropdown && (
                        <div className={`absolute z-50 mt-1 w-full rounded-xl border shadow-lg overflow-hidden ${
                          isDarkMode
                            ? "bg-slate-900 border-slate-800"
                            : "bg-white border-gray-200"
                        }`}>
                          {["All", "Planning", "In Progress", "Completed"].map(x => (
                            <button
                              key={x}
                              type="button"
                              onClick={() => {
                                setStatusFilter(x);
                                setShowStatusDropdown(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left text-sm ${
                                statusFilter === x
                                  ? "bg-indigo-600 text-white"
                                  : isDarkMode
                                  ? "text-slate-300 hover:bg-slate-800"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {x}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {visible.length ? (
              <div className="space-y-4 sm:space-y-5 min-w-0">
                {visible.map((project, index) => {
                  const expanded = expandedProject === project.id;
                  const tasks = project.tasks || [];
                  const progress = Math.max(0, Math.min(100, Number(project.progress) || 0));
                  const number = String((page - 1) * PAGE_SIZE + index + 1).padStart(2, "0");

                  return (
                    <div key={project.id} className="relative min-w-0">
                      <div className={`absolute left-1/2 -top-4 w-px h-4 ${
                        isDarkMode ? "bg-slate-700" : "bg-gray-300"
                      }`} />

                      <div className={`border rounded-2xl overflow-hidden min-w-0 ${
                        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
                      }`}>
                        <button
                          onClick={() => setExpandedProject(expanded ? null : project.id)}
                          className="w-full text-left p-3 sm:p-4 md:p-6 min-w-0"
                        >
                          <div className="flex flex-col gap-4 sm:gap-5 min-w-0">
                            <div className="flex items-start justify-between gap-2.5 sm:gap-3 min-w-0">
                              <div className="flex items-start gap-2.5 sm:gap-4 min-w-0 flex-1">
                                <div className={`w-9 h-9 sm:w-14 sm:h-14 rounded-xl border flex items-center justify-center shrink-0 ${
                                  isDarkMode ? "bg-indigo-950/40 border-indigo-900/50" : "bg-indigo-50 border-indigo-100"
                                }`}>
                                  <span className={`text-sm sm:text-base font-bold ${
                                    isDarkMode ? "text-indigo-400" : "text-indigo-600"
                                  }`}>
                                    {number}
                                  </span>
                                </div>

                                <div className="min-w-0 flex-1 pt-0.5">
                                  <h3 className={`font-semibold text-sm sm:text-base break-words leading-5 sm:leading-6 ${
                                    isDarkMode ? "text-slate-100" : "text-gray-900"
                                  }`}>
                                    {project.name || project.projectName}
                                  </h3>

                                  <p className={`text-xs mt-1 ${
                                    isDarkMode ? "text-slate-500" : "text-gray-500"
                                  }`}>
                                    {tasks.length} {tasks.length === 1 ? "Task" : "Tasks"}
                                  </p>
                                </div>
                              </div>

                              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isDarkMode ? "bg-slate-800" : "bg-gray-100"
                              }`}>
                                {expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                              </div>
                            </div>

                            <div className="w-full min-w-0">
                              <div className="flex justify-between items-center gap-2 mb-2">
                                <span className={`text-[10px] sm:text-[11px] font-semibold ${
                                  isDarkMode ? "text-slate-500" : "text-gray-500"
                                }`}>
                                  PROGRESS
                                </span>

                                <span className={`text-xs font-bold shrink-0 ${
                                  isDarkMode ? "text-indigo-400" : "text-indigo-600"
                                }`}>
                                  {progress}%
                                </span>
                              </div>

                              <div className={`h-2 rounded-full overflow-hidden w-full ${
                                isDarkMode ? "bg-slate-800" : "bg-gray-100"
                              }`}>
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                              <span className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold shrink-0 ${
                                statusStyle(project.status, true)
                              }`}>
                                {normalizeStatus(project.status)}
                              </span>

                              <span className={`text-[10px] text-right ${
                                isDarkMode ? "text-slate-600" : "text-gray-400"
                              }`}>
                                {expanded ? "Click to collapse" : "Click to expand"}
                              </span>
                            </div>
                          </div>
                        </button>

                        {expanded && (
                          <div className={`border-t p-2 sm:p-3 md:p-4 space-y-2.5 sm:space-y-3 min-w-0 ${
                            isDarkMode ? "border-slate-800 bg-slate-950/40" : "border-gray-100 bg-gray-50/70"
                          }`}>
                            {tasks.length ? tasks.map((task, i) => (
                              <div
                                key={task.id || task._id || i}
                                className={`border rounded-xl p-2.5 sm:p-4 min-w-0 ${
                                  isDarkMode ? "bg-slate-900 border-slate-800" : "bg-indigo-50/70 border-indigo-100"
                                }`}
                              >
                                <div className="flex flex-col gap-2.5 sm:gap-3 min-w-0">
                                  <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                                      isDarkMode ? "bg-slate-800 border-slate-700" : "bg-indigo-50 border-indigo-100"
                                    }`}>
                                      <span className={`text-[11px] sm:text-xs font-bold ${
                                        isDarkMode ? "text-slate-400" : "text-indigo-600"
                                      }`}>
                                        {String(i + 1).padStart(2, "0")}
                                      </span>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className={`text-sm font-semibold break-words leading-5 ${
                                        isDarkMode ? "text-slate-200" : "text-gray-800"
                                      }`}>
                                        {task.title}
                                      </p>

                                      <p className={`text-xs mt-1 break-words ${
                                        statusStyle(task.status)
                                      }`}>
                                        {task.status || "Todo"}
                                      </p>
                                    </div>
                                  </div>

                                  <span className={`self-start px-2.5 py-1 rounded-lg border text-[10px] font-bold shrink-0 ${
                                    priorityStyle(task.priority)
                                  }`}>
                                    {task.priority || "Medium"}
                                  </span>
                                </div>

                                <div className={`flex items-start gap-2 mt-3 pt-3 border-t min-w-0 ${
                                  isDarkMode ? "border-slate-800" : "border-indigo-100"
                                }`}>
                                  <User
                                    size={13}
                                    className={`shrink-0 mt-0.5 ${
                                      isDarkMode ? "text-slate-500" : "text-indigo-400"
                                    }`}
                                  />

                                  <span className={`text-xs break-words min-w-0 flex-1 ${
                                    isDarkMode ? "text-slate-400" : "text-gray-500"
                                  }`}>
                                    {task.assignee || "Unassigned"}
                                  </span>
                                </div>
                              </div>
                            )) : (
                              <div className={`text-center border rounded-xl p-5 ${
                                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
                              }`}>
                                <ListTodo size={24} className="mx-auto mb-2 text-gray-400" />
                                <p className={`text-xs ${
                                  isDarkMode ? "text-slate-500" : "text-gray-500"
                                }`}>
                                  No tasks found for this project.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {totalPages > 1 && (
                  <div className="flex flex-wrap justify-center items-center gap-2 pt-2 px-1">
                    <button
                      onClick={() => changePage(Math.max(page - 1, 1))}
                      disabled={page === 1}
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                        page === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : isDarkMode
                          ? "bg-slate-900 border-slate-800 text-slate-400"
                          : "bg-white border-gray-200 text-gray-500"
                      }`}
                    >
                      <ChevronLeft size={17} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                      <button
                        key={n}
                        onClick={() => changePage(n)}
                        className={`w-9 h-9 rounded-lg border text-xs font-semibold shrink-0 ${
                          page === n
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : isDarkMode
                            ? "bg-slate-900 border-slate-800 text-slate-400"
                            : "bg-white border-gray-200 text-gray-500"
                        }`}
                      >
                        {n}
                      </button>
                    ))}

                    <button
                      onClick={() => changePage(Math.min(page + 1, totalPages))}
                      disabled={page === totalPages}
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                        page === totalPages
                          ? "text-gray-300 cursor-not-allowed"
                          : isDarkMode
                          ? "bg-slate-900 border-slate-800 text-slate-400"
                          : "bg-white border-gray-200 text-gray-500"
                      }`}
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={`border border-dashed rounded-2xl p-6 sm:p-8 text-center ${
                isDarkMode ? "bg-slate-950/50 border-slate-700" : "bg-gray-50 border-gray-300"
              }`}>
                <FolderKanban size={28} className="mx-auto mb-3 text-gray-400" />

                <h3 className={`font-semibold ${
                  isDarkMode ? "text-slate-300" : "text-gray-700"
                }`}>
                  {hasFilters ? "No Matching Projects" : "No Projects Found"}
                </h3>

                <p className={`text-sm mt-1 break-words ${
                  isDarkMode ? "text-slate-500" : "text-gray-500"
                }`}>
                  {hasFilters
                    ? "Try changing your search or status filter."
                    : "This workspace does not have any projects yet."}
                </p>

                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-xs font-semibold text-indigo-600"
                  >
                    Clear Search & Filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceProjectMap;