import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Search,
  ArrowLeft,
  LayoutGrid,
    X,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
   Folder,
} from "lucide-react";
import { getMyProjects } from "../../services/memberService";
import ProjectCard from "../../components/cards/ProjectCard";
import { useTheme } from "../../context/ThemeContext";

const SORT_OPTIONS = [
  { value: "", label: "Sort By" },
  { value: "date-newest", label: "Newest First" },
  { value: "date-oldest", label: "Oldest First" },
  { value: "progress-high", label: "Progress High-Low" },
  { value: "progress-low", label: "Progress Low-High" },
  { value: "deadline-near", label: "Deadline: Nearest" },
  { value: "deadline-far", label: "Deadline: Farthest" },
];

const CustomSortDropdown = ({ value, onChange, options, isDarkMode }) => {
  const liveTick = useLiveTick({ resources: ["projects", "tasks"] });
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = event => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel =
    options.find(opt => opt.value === value)?.label || options[0]?.label || "";

  return (
    <div className="relative w-full sm:w-52 shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`relative w-full min-w-0 h-10 min-[430px]:h-11 pl-9 min-[430px]:pl-10 pr-9 min-[430px]:pr-10 rounded-xl outline-none  focus:ring-blue-500 text-xs min-[430px]:text-sm font-medium flex items-center justify-between gap-2 transition-all border ${isDarkMode
          ? "bg-[#11182B] border-[#263149] text-white focus:border-blue-500"
          : "bg-white border-gray-200 text-gray-800 focus:border-blue-400"
          }`}
      >
        <SlidersHorizontal
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          size={16}
        />

        <span className="truncate text-left">{selectedLabel}</span>

        <ChevronDown
          size={15}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""
            }`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-20 mt-1.5 w-full rounded-xl border shadow-lg  ${isDarkMode
            ? "bg-[#11182B] border-[#263149]"
            : "bg-white border-gray-200"
            }`}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 text-xs min-[430px]:text-sm font-medium truncate transition-colors ${value === opt.value
                ? "bg-blue-600 text-white"
                : isDarkMode
                  ? "text-gray-300 hover:bg-[#1D2940]"
                  : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TMProjects = () => {
  const { isDarkMode } = useTheme();
  const { state } = useLocation();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const PROJECTS_PER_PAGE = 9;

  const currentWorkspaceId = state?._id || state?.id || null;
  const workspaceName = state?.name || "Workspace";
  const workspaceDesc = state?.description || "No description available.";

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);

        const data = await getMyProjects();
        const allProjects = Array.isArray(data?.projects) ? data.projects : [];

        const workspaceProjects = currentWorkspaceId
          ? allProjects.filter(project => {
            const id =
              project.workspace?._id ||
              project.workspace?.id ||
              project.workspace;

            return String(id) === String(currentWorkspaceId);
          })
          : allProjects;

        setProjects(workspaceProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [currentWorkspaceId, liveTick]);

  const filteredProjects = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const result = projects.filter(project => {
      const name =
        project.projectName || project.title || project.name || "";
      const description = project.description || "";

      return (
        name.toLowerCase().includes(search) ||
        description.toLowerCase().includes(search)
      );
    });

    const getProgress = project => {
      const total = project.tasksCount ?? project.total ?? 0;
      const completed = project.completedTasks ?? project.completed ?? 0;

      return total > 0
        ? Math.min(100, Math.round((completed / total) * 100))
        : 0;
    };

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "date-newest": return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "date-oldest": return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case "progress-high": return getProgress(b) - getProgress(a);
        case "progress-low": return getProgress(a) - getProgress(b);
        case "deadline-near": return ((a.deadline ? new Date(a.deadline).getTime() : Infinity) - (b.deadline ? new Date(b.deadline).getTime() : Infinity));
        case "deadline-far": return ((b.deadline ? new Date(b.deadline).getTime() : 0) - (a.deadline ? new Date(a.deadline).getTime() : 0));
        default:
          return 0;
      }
    });
  }, [projects, searchTerm, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE)
  );

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * PROJECTS_PER_PAGE;
    return filteredProjects.slice(start, start + PROJECTS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, viewMode]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const goToPage = page => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (currentPage >= totalPages - 2) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  };

  const pageNumbers = getPageNumbers();

  if (loading) {
    return (
      <div
        className={`min-h-screen p-10 text-center ${isDarkMode
          ? "bg-[#05091D] text-gray-300"
          : "bg-gray-50 text-gray-900"
          }`}
      >
        Loading projects...
      </div>
    );
  }

  return (
    <div
      className={`w-full min-h-screen pt-4 px-4 sm:px-6 lg:px-10 pb-10 transition-colors duration-300 overflow-x-hidden ${isDarkMode
        ? "bg-[#05091D] text-white"
        : "bg-gray-50/50 text-gray-900"
        }`}
    >
      {/* Page header */}
      <div className="space-y-1 mb-2">
        <div className="flex items-start gap-4">
          <Link
            to="/team-member/tm-workspace"
            aria-label="Back to workspaces"
            className={`mt-1 p-3 rounded-2xl border shrink-0 transition-all duration-200 ${isDarkMode
              ? "bg-[#11182B] border-[#263149] text-gray-300 hover:bg-[#18223A] hover:border-[#33415f]"
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm"
              }`}
          >
            <ArrowLeft size={20} />
          </Link>

          <div className="min-w-0 flex-1">
            <h1
              className={`text-3xl sm:text-4xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"
                }`}
            >
              {workspaceName}
            </h1>

            <div className="mt-1">
              <p
                className={`text-sm leading-relaxed [overflow-wrap:anywhere] ${isDarkMode ? "text-gray-400" : "text-gray-500"
                  } ${!showFullDesc && workspaceDesc.length > 100
                    ? "line-clamp-1"
                    : ""
                  }`}
              >
                {showFullDesc || workspaceDesc.length <= 100
                  ? workspaceDesc
                  : `${workspaceDesc.slice(0, 100).trim()}...`}
              </p>

              {workspaceDesc.length > 100 && (
                <button
                  type="button"
                  onClick={() => setShowFullDesc(prev => !prev)}
                  className="mt-1 font-semibold text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {showFullDesc ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search, sort and view controls */}
      <div className="mt-5 mb-7 w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 w-full">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-[24rem]">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={18}
              />

              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`w-full h-11 pl-10 pr-10 rounded-xl outline-none  focus:ring-blue-500 transition-all text-sm border ${isDarkMode
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
                  className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors ${isDarkMode
                      ? "text-gray-400 hover:text-white hover:bg-[#263149]"
                      : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <X size={15} strokeWidth={2.5} />
                </button>
              )}
            </div>

            <CustomSortDropdown
              value={sortBy}
              onChange={setSortBy}
              isDarkMode={isDarkMode}
              options={SORT_OPTIONS}
            />
          </div>

          <div className="hidden md:flex w-full md:w-auto">
            <div
              className={`h-11 w-full md:w-auto flex items-center rounded-xl p-1 border ${isDarkMode
                ? "bg-[#11182B] border-[#263149]"
                : "bg-white border-gray-200"
                }`}
            >
              {[
                ["grid", LayoutGrid, "Grid"],
                ["list", List, "List"],
              ].map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`h-9 flex-1 md:flex-none px-3 min-[430px]:px-4 rounded-lg flex items-center justify-center gap-1.5 min-[430px]:gap-2 text-[11px] min-[430px]:text-xs font-semibold whitespace-nowrap transition-all duration-200 ${viewMode === mode
                    ? "bg-blue-600 text-white shadow-sm"
                    : isDarkMode
                      ? "text-gray-400 hover:text-white hover:bg-[#1D2940]"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                  aria-label={`${label} view`}
                  title={`${label} View`}
                >
                  <Icon size={mode === "grid" ? 14 : 15} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="w-full">
        {paginatedProjects.length ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 pb-8 w-full">
              {paginatedProjects.map(project => (
                <ProjectCard
                  key={project._id || project.id}
                  project={project}
                  userRole="teammember"
                  viewMode="grid"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4 pb-8 w-full min-w-0">
              {paginatedProjects.map(project => (
                <ProjectCard
                  key={project._id || project.id}
                  project={project}
                  userRole="teammember"
                  viewMode="list"
                />
              ))}
            </div>
          )
        ) : (
          <div
            className={`min-h-[300px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-6 text-center w-full ${isDarkMode
              ? "border-[#263149] bg-[#11182B]"
              : "border-gray-200 bg-white/60"
              }`}
          >
           <div
  className={`w-14 h-14 mb-3 rounded-2xl flex items-center justify-center ${
    isDarkMode
      ? "bg-[#1D2940] text-gray-400"
      : "bg-gray-100 text-gray-400"
  }`}
>
  <Folder size={28} strokeWidth={1.8} />
</div>

            <h3
              className={`font-bold ${isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
            >
              No Projects Found
            </h3>

            <p
              className={`text-sm mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"
                }`}
            >
              {searchTerm
                ? "No projects match your search."
                : "No projects found in this workspace."}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="w-full min-w-0 flex items-center justify-center gap-1 min-[430px]:gap-1.5 mb-4 overflow-x-auto">
          <div className="flex items-center justify-center gap-1 min-[430px]:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`w-8 h-8 min-[430px]:w-9 min-[430px]:h-9 rounded-lg flex items-center justify-center border text-xs min-[430px]:text-sm font-medium transition ${currentPage === 1
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
                className={`w-8 h-8 min-[430px]:w-9 min-[430px]:h-9 rounded-lg border text-[11px] min-[430px]:text-xs font-bold transition ${currentPage === page
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
              className={`w-8 h-8 min-[430px]:w-9 min-[430px]:h-9 rounded-lg flex items-center justify-center border text-xs min-[430px]:text-sm font-medium transition ${currentPage === totalPages
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
        </div>
      )}
    </div>
  );
};

export default TMProjects;
