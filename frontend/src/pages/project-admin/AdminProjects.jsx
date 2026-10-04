import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Grid3X3,
  List,
  X,
} from "lucide-react";
import ProjectCard from "../../components/cards/ProjectCard";
import InviteButton from "../../components/buttons/InviteButton";
import InviteForm from "../../components/forms/InviteMemberForm";
import ProjectAttentionCenter from "../../components/admin/ProjectAttentionCenter";
import { useTheme } from "../../context/ThemeContext";

const PER_PAGE = 9;
const adminProjectsCache = new Map();

const AdminProjects = () => {
  const liveTick = useLiveTick({ resources: ["projects", "tasks", "workspaces"] });
  const { state, search } = useLocation();
  const { workspaceId } = useParams();
  const { isDarkMode: dark } = useTheme();
  const descRef = useRef(null);
  const sortRef = useRef(null);
 const [searchTerm, setSearchTerm] = useState("");
const [sortBy, setSortBy] = useState("");
const [projects, setProjects] = useState([]);
const [sortOpen, setSortOpen] = useState(false);
const [activeWorkspace, setActiveWorkspace] = useState(null);
const [currentWorkspaceId, setCurrentWorkspaceId] = useState(workspaceId || null);
const [currentPage, setCurrentPage] = useState(1);
const [viewMode, setViewMode] = useState("grid");
const [loading, setLoading] = useState(true);
const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
const [workspaceReady, setWorkspaceReady] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [longDesc, setLongDesc] = useState(false);

  const workspaceName =
    activeWorkspace?.name ||
    activeWorkspace?.workspaceName ||
    state?.name ||
    "Workspace Projects";

  const workspaceDesc =
    activeWorkspace?.description ||
    state?.description ||
    "Overview of projects in this workspace.";

  const panel = dark
    ? "bg-[#11182B] border-[#263149]"
    : "bg-white border-gray-200";

  useEffect(() => {
    const load = () => {
      try {
        const ws = JSON.parse(localStorage.getItem("activeWorkspace") || "null");
        setActiveWorkspace(ws);
        setCurrentWorkspaceId(ws?.id || ws?._id || workspaceId || null);
      } catch (error) {
        console.error("Error reading active workspace:", error);
        setActiveWorkspace(null);
        setCurrentWorkspaceId(workspaceId || null);
      } finally {
        setWorkspaceReady(true);
      }
    };

    setWorkspaceReady(false);
    load();

    const onStorage = e => {
      if (e.key === "activeWorkspace") {
        setWorkspaceReady(false);
        load();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [workspaceId]);

  useEffect(() => {
    if (new URLSearchParams(search).get("invite") === "true")
      setShowInviteModal(true);
  }, [search]);

  useEffect(() => {
    setShowDesc(false);

    const check = () => {
      const el = descRef.current;
      if (el)
        setLongDesc(
          el.scrollHeight > parseFloat(getComputedStyle(el).lineHeight) + 2
        );
    };

    const timer = setTimeout(check);
    window.addEventListener("resize", check);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", check);
    };
  }, [workspaceDesc]);

  useEffect(() => {
    const handleClickOutside = e => {
      if (sortRef.current && !sortRef.current.contains(e.target))
        setSortOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

const fetchProjects = useCallback(async () => {
  try {
    const cacheKey = currentWorkspaceId || "all";
    const cachedProjects = adminProjectsCache.get(cacheKey);

    if (!hasLoadedOnce) {
      setLoading(!cachedProjects);
    }

    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token");

    if (!token) {
      setProjects([]);
      return;
    }

    const { data } = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/projects/workspace/${currentWorkspaceId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const freshProjects = Array.isArray(data)
      ? data
      : data?.projects || [];

    setProjects(freshProjects);
    adminProjectsCache.set(cacheKey, freshProjects);
    setCurrentPage(1);
  } catch (error) {
    console.error("Error fetching projects:", error.response?.data || error);

    if (!adminProjectsCache.get(currentWorkspaceId || "all")) {
      setProjects([]);
    }
  } finally {
    setLoading(false);
    setHasLoadedOnce(true);
  }
}, [currentWorkspaceId, hasLoadedOnce]);
useEffect(() => {
  if (!workspaceReady) return;

  if (!currentWorkspaceId) {
    setProjects([]);
    setLoading(false);
    return;
  }

  const cacheKey = currentWorkspaceId || "all";
  const cachedProjects = adminProjectsCache.get(cacheKey);

  if (cachedProjects) {
    setProjects(cachedProjects);
    setLoading(false);
    setHasLoadedOnce(true);
  }

  fetchProjects();
}, [currentWorkspaceId, workspaceReady, fetchProjects, liveTick]);

  const handleDeleteProject = async (id, count = 0) => {
    const message = count
      ? `This project has ${count} task${count === 1 ? "" : "s"}. Are you sure you want to delete the project?`
      : "Are you sure you want to delete this project?";

    if (!window.confirm(message)) return;

    try {
      const token =
        sessionStorage.getItem("token") || localStorage.getItem("token");

      if (!token) return window.alert("Authentication token not found.");

      await axios.delete(`${process.env.REACT_APP_API_URL}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProjects(prev =>
        prev.filter(project => (project._id || project.id) !== id)
      );
    } catch (error) {
      console.error("Error deleting project:", error.response?.data || error);
      window.alert(error.response?.data?.message || "Failed to delete project.");
    }
  };

  const getName = project =>
    String(project.projectName || project.name || "Untitled Project");

  const getDeadline = project =>
    project.endDate || project.deadline || project.dueDate;

  const sorted = projects
    .filter(p => getName(p).toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const date = key => new Date(key || 0);
      const values = {
        newest: date(b.createdAt) - date(a.createdAt),
        oldest: date(a.createdAt) - date(b.createdAt),
        progressHigh: Number(b.progress || 0) - Number(a.progress || 0),
        progressLow: Number(a.progress || 0) - Number(b.progress || 0),
        deadlineNear: date(getDeadline(a)) - date(getDeadline(b)),
        deadlineFar: date(getDeadline(b)) - date(getDeadline(a)),
      };
      return values[sortBy] || 0;
    });

  useEffect(() => setCurrentPage(1), [searchTerm, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const pageItems = sorted.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  const pages =
    totalPages <= 5
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : currentPage <= 3
      ? [1, 2, 3, 4, 5]
      : currentPage >= totalPages - 2
      ? Array.from({ length: 5 }, (_, i) => totalPages - 4 + i)
      : Array.from({ length: 5 }, (_, i) => currentPage - 2 + i);

  const goToPage = page => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const viewButtons = [
    ["grid", Grid3X3, "Grid"],
    ["list", List, "List"],
  ];

  const sortOptions = [
    ["", "Sort By"],
    ["newest", "Newest First"],
    ["oldest", "Oldest First"],
    ["progressHigh", "Progress High → Low"],
    ["progressLow", "Progress Low → High"],
    ["deadlineNear", "Deadline Nearest"],
    ["deadlineFar", "Deadline Farthest"],
  ];

  const selectedSort =
    sortOptions.find(([value]) => value === sortBy)?.[1] || "Sort By";

  return (
    <div
      className={`w-full min-w-0 min-h-screen overflow-x-hidden p-3 min-[430px]:p-4 sm:p-5 lg:p-6 ${
        dark ? "bg-[#05091D] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="space-y-5 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex gap-3 min-w-0 flex-1">
            <Link
              to="/project-admin/manage-workspaces"
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 ${panel}`}
            >
              <ArrowLeft size={17} />
            </Link>

            <div className="min-w-0 flex-1">
              <h1
                className={`text-2xl sm:text-3xl font-bold tracking-tight break-words ${
                  dark ? "text-white" : "text-gray-800"
                }`}
              >
                {workspaceName}
              </h1>

              <p
                ref={descRef}
                className={`text-xs sm:text-sm mt-1 pr-2 break-words ${
                  dark ? "text-gray-400" : "text-gray-500"
                } ${showDesc ? "" : "line-clamp-1"}`}
              >
                {workspaceDesc}
              </p>

              {longDesc && (
                <button
                  type="button"
                  onClick={() => setShowDesc(v => !v)}
                  className="text-xs font-semibold text-blue-600 mt-1"
                >
                  {showDesc ? "Show Less" : "Show More"}
                </button>
              )}
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto sm:ml-8">
            <InviteButton onClick={() => setShowInviteModal(true)} />
          </div>
        </div>

        <div className="mb-5 min-[600px]:mb-6 w-full max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full">
            <div className="relative w-full sm:w-72 md:w-80 xl:w-96 shrink-0">
              <Search
                size={15}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  dark ? "text-gray-500" : "text-gray-400"
                }`}
              />

              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search projects..."
                className={`w-full h-10 pl-9 pr-10 rounded-xl border text-sm outline-none focus:border-blue-500 ${
                  dark
                    ? "bg-[#11182B] border-[#263149] text-white placeholder-gray-500"
                    : "bg-white border-gray-200 text-gray-700 placeholder-gray-400 focus:border-blue-400"
                }`}
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center ${
                    dark
                      ? "bg-white/10 hover:bg-white/20 text-gray-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                  }`}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:contents">
              <div ref={sortRef} className="relative w-full sm:w-48 shrink-0">
                <SlidersHorizontal
                  size={15}
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 z-10 ${
                    dark ? "text-gray-500" : "text-gray-400"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setSortOpen(v => !v)}
                 className={`w-full h-10 pl-9 pr-9 rounded-xl border text-sm text-left whitespace-nowrap outline-none focus:border-blue-500 ${
                    dark
                      ? "bg-[#11182B] border-[#263149] text-white"
                      : "bg-white border-gray-200 text-gray-700 focus:border-blue-400"
                  }`}
                >
                  {selectedSort}
                </button>

                <ChevronDown
                  size={16}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                    dark ? "text-gray-500" : "text-gray-400"
                  }`}
                />

                {sortOpen && (
                  <div
                    className={`absolute z-50 mt-1 w-full rounded-xl border shadow-lg overflow-hidden ${
                      dark
                        ? "bg-[#11182B] border-[#263149]"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {sortOptions.map(([value, label]) => (
                      <button
                        key={value || "default"}
                        type="button"
                        onClick={() => {
                          setSortBy(value);
                          setSortOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm ${
                          sortBy === value
                            ? "bg-blue-600 text-white"
                            : dark
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
                {!loading && (
                  <div className="w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">
                    <ProjectAttentionCenter
                      projects={projects}
                      isDarkMode={dark}
                    />
                  </div>
                )}
              </div>
            </div>

            <div
              className={`hidden sm:flex items-center rounded-xl border p-1 shrink-0 ${panel}`}
            >
              {viewButtons.map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`h-8 px-2.5 sm:px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold ${
                    viewMode === mode
                      ? "bg-blue-600 text-white"
                      : dark
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className={`h-48 rounded-2xl border animate-pulse ${panel}`}
              />
            ))}
          </div>
        ) : sorted.length ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                : "flex flex-col gap-4"
            }
          >
            {pageItems.map(project => (
              <ProjectCard
                key={project._id || project.id}
                project={project}
                userRole="projectadmin"
                viewMode={viewMode}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        ) : (
          <div
            className={`h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center px-4 ${
              dark
                ? "border-[#263149] bg-[#11182B]/60"
                : "border-gray-300 bg-white"
            }`}
          >
            <div className="text-4xl mb-3 opacity-40">📂</div>
            <h3
              className={`text-lg font-bold ${
                dark ? "text-gray-300" : "text-gray-800"
              }`}
            >
              No Projects Found
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              No projects found in this workspace.
            </p>
          </div>
        )}

        {sorted.length > 0 && totalPages > 1 && (
          <div className="w-full overflow-x-auto">
            <div className="flex items-center justify-center gap-1.5 mt-5 min-w-max px-1">
              <button
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
                className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                  currentPage === 1 ? "opacity-40 cursor-not-allowed" : ""
                }`}
              >
                <ChevronLeft size={17} />
              </button>

              {pages.map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-9 h-9 rounded-lg border text-xs font-bold ${
                    currentPage === page
                      ? "bg-blue-600 border-blue-600 text-white"
                      : dark
                      ? "border-[#374151] text-gray-300"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
                className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                  currentPage === totalPages
                    ? "opacity-40 cursor-not-allowed"
                    : ""
                }`}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInviteModal(false)}
          />

          <div className="relative z-[110] w-full max-w-md max-h-[calc(100vh-24px)] sm:max-h-[calc(100vh-32px)] overflow-y-auto">
            <InviteForm
              onClose={() => setShowInviteModal(false)}
              userRole="projectadmin"
              workspaceId={currentWorkspaceId}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjects;
