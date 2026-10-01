import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";
import TaskCard from "../../components/cards/TaskCard";
import { getMyTasks } from "../../services/memberService";
import { getProjectById } from "../../services/projectService";
import { useTheme } from "../../context/ThemeContext";
import ProjectDiscussion from "../../components/project/ProjectDiscussion";

const TASKS_PER_LOAD = 9;
const DESCRIPTION_LIMIT = 100;

const TASK_SORT_OPTIONS = [
  { value: "", label: "Sort By" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "priorityHigh", label: "Priority: High → Low" },
  { value: "priorityLow", label: "Priority: Low → High" },
  { value: "dueNear", label: "Due Date: Nearest" },
  { value: "dueFar", label: "Due Date: Farthest" },
];

// Media query hook
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
};

// Custom sort dropdown
const CustomSortDropdown = ({ value, onChange, options, isDarkMode }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const label = options.find(o => o.value === value)?.label || options[0]?.label;

  return (
    <div ref={ref} className="relative w-full min-w-0 sm:w-52 sm:shrink-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`relative w-full min-h-10 min-[430px]:min-h-11 py-2 pl-7 min-[430px]:pl-10 pr-6 min-[430px]:pr-10 rounded-xl outline-none text-[11px] min-[430px]:text-sm font-medium flex items-center border transition-all ${isDarkMode
          ? "bg-[#11182B] border-[#263149] text-white focus:border-blue-500"
          : "bg-white border-gray-200 text-gray-800 focus:border-blue-400"
          }`}
      >
        <SlidersHorizontal size={15} className="absolute left-2 min-[430px]:left-3 text-gray-400" />
        <span className="min-w-0 w-full flex-1 whitespace-normal break-normal text-left leading-tight">{label}</span>
        <ChevronDown
          size={15}
          className={`absolute right-2 min-[430px]:right-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className={`absolute z-40 mt-1.5 w-full rounded-xl border shadow-lg ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-200"
          }`}>
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 text-xs min-[430px]:text-sm font-medium whitespace-normal break-normal leading-snug transition-colors ${value === option.value
                ? "bg-blue-600 text-white"
                : isDarkMode
                  ? "text-gray-300 hover:bg-[#1D2940]"
                  : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CustomStatusDropdown = ({ value, onChange, filters, isDarkMode }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = filters.find(([label]) => label === value) || filters[0];

  useEffect(() => {
    const close = event => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full min-h-10 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-sm font-semibold text-left transition-colors ${isDarkMode
          ? "bg-[#11182B] border-[#263149] text-white"
          : "bg-white border-gray-200 text-gray-800"
          }`}
      >
        <span>{selected[0]}</span>
        <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-xl border shadow-lg ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-200"
            }`}
        >
          {filters.map(([label, count]) => (
            <button
              key={label}
              type="button"
              role="option"
              aria-selected={value === label}
              onClick={() => {
                onChange(label);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm font-medium text-left transition-colors ${value === label
                ? "bg-blue-600 text-white"
                : isDarkMode
                  ? "text-gray-300 hover:bg-[#1D2940]"
                  : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              <span>{label}</span>
              <span className={value === label ? "text-blue-100" : "opacity-60"}>{count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TMTasks = () => {
  const { isDarkMode } = useTheme();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const isXL = useMediaQuery("(min-width: 1280px)");

  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [memberTasks, setMemberTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectInfo, setProjectInfo] = useState({ name: "", description: "" });
  const [projectData, setProjectData] = useState(null);

  const projectTitle = projectInfo.name || state?.name || state?.title || "Tasks";
  const projectDescription =
    projectInfo.description || state?.description || "No description available.";
  const isLongDescription = projectDescription.length > DESCRIPTION_LIMIT;
  const displayedDescription =
    !showFullDescription && isLongDescription
      ? `${projectDescription.slice(0, DESCRIPTION_LIMIT).trim()}...`
      : projectDescription;
  useEffect(() => setShowFullDescription(false), [projectId]);

  // Fetch project details
  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        const data = await getProjectById(projectId);
        const project = data.project || data;
        setProjectData(project);
        setProjectInfo({
          name: project.projectName || project.name || "Tasks",
          description: project.description || "No description available.",
        });
      } catch (error) {
        console.error("Error fetching project details:", error);
      }
    };

    fetchProject();
  }, [projectId]);

  // Fetch member tasks
  useEffect(() => {
    if (!projectId) return;

    const fetchTasks = async () => {
      try {
        setLoading(true);
        const tasks = (await getMyTasks()).tasks || [];
        setMemberTasks(
          tasks.filter(task => {
            const id = task.project?._id || task.project?.id || task.project;
            return String(id) === String(projectId);
          })
        );
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [projectId]);

  const filterCounts = useMemo(() => ({
    all: memberTasks.length,
    todo: memberTasks.filter(t => ["To Do", "Todo"].includes(t.status)).length,
    inprogress: memberTasks.filter(t => t.status === "In Progress").length,
    completed: memberTasks.filter(t => t.status === "Completed").length,
  }), [memberTasks]);

  const processedTasks = useMemo(() => {
    let result = [...memberTasks];
    const search = searchTerm.trim().toLowerCase();

    if (search) {
      result = result.filter(task => {
        const title = (task.taskTitle || task.title || "").toLowerCase();
        return title.includes(search) || (task.description || "").toLowerCase().includes(search);
      });
    }

    if (activeFilter !== "All") {
      result = result.filter(task => (task.status === "Todo" ? "To Do" : task.status) === activeFilter);
    }

    if (sortBy) {
      const priority = { High: 3, Medium: 2, Low: 1 };
      result.sort((a, b) => {
        const createdA = new Date(a.createdAt || 0).getTime();
        const createdB = new Date(b.createdAt || 0).getTime();

        switch (sortBy) {
          case "newest": return createdB - createdA;
          case "oldest": return createdA - createdB;
          case "priorityHigh": return (priority[b.priority] || 0) - (priority[a.priority] || 0);
          case "priorityLow": return (priority[a.priority] || 0) - (priority[b.priority] || 0);
          case "dueNear": return (a.deadline ? new Date(a.deadline).getTime() : Infinity) - (b.deadline ? new Date(b.deadline).getTime() : Infinity);
          case "dueFar": return (b.deadline ? new Date(b.deadline).getTime() : 0) - (a.deadline ? new Date(a.deadline).getTime() : 0);
          default: return 0;
        }
      });
    }

    return result;
  }, [memberTasks, searchTerm, activeFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(processedTasks.length / TASKS_PER_LOAD));

  useEffect(() => setCurrentPage(1), [searchTerm, activeFilter, sortBy, viewMode]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * TASKS_PER_LOAD;
  const visibleTasks = processedTasks.slice(startIndex, startIndex + TASKS_PER_LOAD);

  //  pagination
  const goToPage = page => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pageNumbers = totalPages <= 5
    ? Array.from({ length: totalPages }, (_, i) => i + 1)
    : currentPage <= 3
      ? [1, 2, 3, 4, 5]
      : currentPage >= totalPages - 2
        ? [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
        : [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];

  const filters = [
    ["All", filterCounts.all],
    ["To Do", filterCounts.todo],
    ["In Progress", filterCounts.inprogress],
    ["Completed", filterCounts.completed],
  ];

  if (loading) {
    return (
      <div className={`w-full min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#05091D] text-gray-300" : "bg-gray-50 text-gray-900"
        }`}>
        Loading tasks...
      </div>
    );
  }

  return (
    <div className={`w-full min-h-screen pt-4 px-4 sm:px-6 lg:px-10 pb-10 overflow-x-hidden transition-colors duration-300 ${isDarkMode ? "bg-[#05091D] text-white" : "bg-gray-50/50 text-gray-900"
      }`}>
      {/* Project Header */}
      <div className="mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border transition-all ${isDarkMode
              ? "bg-[#11182B] border-[#263149] text-gray-300 hover:bg-[#18223A]"
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:shadow-sm"
              }`}
            aria-label="Go back"
          ><ArrowLeft size={20} />
          </button>

          <h1 className={`min-w-0 flex-1 text-2xl sm:text-4xl font-bold tracking-tight break-words ${isDarkMode ? "text-white" : "text-gray-900"}`}
            style={{ overflowWrap: "anywhere" }}
          >{projectTitle}</h1>
        </div>

        <div className="mt-2 sm:pl-[60px] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <p className={`min-w-0 max-w-4xl text-sm leading-relaxed break-words ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {displayedDescription}
            {isLongDescription && (
              <button
                type="button"
                onClick={() => setShowFullDescription(v => !v)}
                className="ml-1 font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {showFullDescription ? "Show less" : "Show more"}
              </button>
            )}
          </p>
          {isDesktop && !isXL && (<div className="shrink-0"><ProjectDiscussion project={projectData} />
          </div>
          )}
        </div>
      </div>

      {/* Task Controls */}
      <div className="relative mt-6 mb-7 w-full">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 w-full">
          <div className="grid grid-cols-2 items-stretch gap-2 w-full sm:flex sm:flex-row sm:items-center sm:gap-2 xl:w-auto">
            <div className="relative col-span-1 min-w-0 w-full sm:w-[320px] xl:w-[380px] shrink-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 sm:left-3" size={17} />
              <input
                type="text"
                placeholder={isDesktop ? "Search tasks..." : "Search"}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`w-full h-11 pl-8 pr-8 sm:pl-10 sm:pr-11 rounded-xl outline-none text-xs sm:text-sm border ${isDarkMode
                  ? "bg-[#11182B] border-[#263149] text-white placeholder:text-gray-500 focus:border-blue-500"
                  : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400"
                  }`}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                  title="Clear search"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}
                >
                  <X size={15} strokeWidth={2} />
                </button>
              )}
            </div>
            <div className="min-w-0 sm:flex-none">
              <CustomSortDropdown
                value={sortBy}
                onChange={setSortBy}
                isDarkMode={isDarkMode}
                options={TASK_SORT_OPTIONS}
              />
            </div>

            {!isDesktop && (
              <div className="min-w-0 [&>button]:w-full [&>button]:min-h-10 [&>button]:h-auto [&>button>svg]:hidden [&>button>span]:whitespace-normal [&>button>span]:break-normal [&>button>span]:overflow-visible [&>button>span]:text-clip [&>button>span]:text-left [&>button>span]:leading-tight">
                <ProjectDiscussion project={projectData} />
              </div>
            )}

            <div className="min-w-0 sm:hidden">
              <CustomStatusDropdown
                value={activeFilter}
                onChange={setActiveFilter}
                filters={filters}
                isDarkMode={isDarkMode}
              />
            </div>

          </div>

          <div className="hidden xl:flex shrink-0 items-center gap-2">
            <div className="shrink-0">
              <ProjectDiscussion project={projectData} />
            </div>
            <div className={`h-11 flex items-center rounded-xl p-1 border ${isDarkMode
              ? "bg-[#11182B] border-[#263149]"
              : "bg-white border-gray-200"
              }`}>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`h-9 px-3 min-[430px]:px-4 rounded-lg flex items-center justify-center gap-1.5 min-[430px]:gap-2 text-[11px] min-[430px]:text-xs font-semibold whitespace-nowrap transition-all duration-200 ${viewMode === "grid"
                  ? "bg-blue-600 text-white shadow-sm"
                  : isDarkMode
                    ? "text-gray-400 hover:text-white hover:bg-[#1D2940]"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                aria-label="Grid view"
                title="Grid View"
              >
                <LayoutGrid size={14} />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`h-9 px-3 min-[430px]:px-4 rounded-lg flex items-center justify-center gap-1.5 min-[430px]:gap-2 text-[11px] min-[430px]:text-xs font-semibold whitespace-nowrap transition-all duration-200 ${viewMode === "list"
                  ? "bg-blue-600 text-white shadow-sm"
                  : isDarkMode
                    ? "text-gray-400 hover:text-white hover:bg-[#1D2940]"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                aria-label="List view"
                title="List View"
              >
                <List size={15} />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Filters */}
        <div className="mt-4 hidden sm:flex sm:items-center sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map(([label, count]) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveFilter(label)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${activeFilter === label
                ? "bg-blue-600 text-white shadow-sm"
                : isDarkMode
                  ? "bg-[#18223A] text-gray-400 hover:text-white hover:bg-[#202C47]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              {label}
              <span className={`ml-1.5 ${activeFilter === label ? "text-blue-100" : "opacity-60"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Task Results */}
      {visibleTasks.length ? (
        <>
          <div className={viewMode === "grid"
            ? "w-full min-w-0 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5"
            : "w-full space-y-4"
          }>
            {visibleTasks.map(task => (
              <div key={task._id || task.id} className="w-full">
                <TaskCard task={task} userRole="teammember" viewMode={viewMode} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="w-full flex items-center justify-center gap-1.5 my-4 overflow-x-auto">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`w-9 h-9 rounded-lg flex items-center justify-center border ${currentPage === 1
                  ? isDarkMode
                    ? "border-[#263149] text-gray-600 cursor-not-allowed"
                    : "border-gray-200 text-gray-300 cursor-not-allowed"
                  : isDarkMode
                    ? "border-[#374151] text-gray-300 hover:bg-[#1D2940]"
                    : "border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                aria-label="Previous page"
              >
                <ChevronLeft size={17} />
              </button>

              {pageNumbers.map(page => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={`w-9 h-9 rounded-lg border text-xs font-bold ${currentPage === page
                    ? "bg-blue-600 border-blue-600 text-white"
                    : isDarkMode
                      ? "border-[#374151] text-gray-300 hover:bg-[#1D2940]"
                      : "border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`w-9 h-9 rounded-lg flex items-center justify-center border ${currentPage === totalPages
                  ? isDarkMode
                    ? "border-[#263149] text-gray-600 cursor-not-allowed"
                    : "border-gray-200 text-gray-300 cursor-not-allowed"
                  : isDarkMode
                    ? "border-[#374151] text-gray-300 hover:bg-[#1D2940]"
                    : "border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                aria-label="Next page"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className={`w-full py-20 text-center rounded-3xl border-2 border-dashed ${isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-gray-50 border-gray-200"
          }`}>
          <List size={40} className={`mx-auto mb-3 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
          <p className={isDarkMode ? "text-gray-400 font-medium" : "text-gray-500 font-medium"}>
            No tasks found.
          </p>

          {(searchTerm || activeFilter !== "All" || sortBy) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setActiveFilter("All");
                setSortBy("");
              }}
              className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TMTasks;