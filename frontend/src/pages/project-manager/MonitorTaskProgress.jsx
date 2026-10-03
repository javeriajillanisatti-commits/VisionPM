import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useParams } from "react-router-dom";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Search, CalendarDays, History, LayoutGrid, Rows, LineChart, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import TaskProgressCard from "../../components/cards/TaskProgressCard";
import axios from "axios";

const MonitorTaskProgress = () => {
  const liveTick = useLiveTick({ resources: ["workspaces", "projects", "tasks"] });
  const { projectId } = useParams();
  const { activeWorkspace } = useWorkspace();
  const { isDarkMode } = useTheme();
  const [projectsData, setProjectsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState("newest");
  const [viewMode, setViewMode] = useState("detailed");
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const handleViewportChange = (event) => setIsMobile(event.matches);
    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleViewportChange);
    return () => mediaQuery.removeEventListener("change", handleViewportChange);
  }, []);

  const effectiveViewMode = isMobile ? "detailed" : viewMode;

  useEffect(() => {
    let cancelled = false;
    let requestInFlight = false;

    const getTargetWorkspaceId = () => {
      let targetWorkspaceId = activeWorkspace?.id || activeWorkspace?._id;
      if (!targetWorkspaceId) {
        const savedWS = localStorage.getItem("activeWorkspace");
        if (savedWS) {
          try {
            const parsedWS = JSON.parse(savedWS);
            targetWorkspaceId = parsedWS.id || parsedWS._id;
          } catch (error) {
            console.error("Unable to read saved active workspace:", error);
          }
        }
      }
      return targetWorkspaceId;
    };

    const fetchRealMonitorAnalytics = async (showLoader = false) => {
      const targetWorkspaceId = getTargetWorkspaceId();
      if (!targetWorkspaceId || cancelled || requestInFlight) return;
      requestInFlight = true;
      try {
        if (showLoader) setLoading(true);
        const token = sessionStorage.getItem("token");
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/workspaces/${targetWorkspaceId}/monitor`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!cancelled) setProjectsData(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        if (!cancelled) console.error("Error connecting with monitor dashboard analytics server:", err);
      } finally {
        requestInFlight = false;
        if (showLoader && !cancelled) setLoading(false);
      }
    };

    fetchRealMonitorAnalytics(true);
    const handleFocus = () => fetchRealMonitorAnalytics(false);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchRealMonitorAnalytics(false);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeWorkspace, liveTick]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDateFromObjectId = (idString) => {
    if (!idString || idString.length !== 24) return 0;
    return parseInt(idString.substring(0, 8), 16) * 1000;
  };

  const filteredAndSortedProjects = projectsData
    .filter((p) => {
      const currentProjId = p._id || p.id || "";
      const query = searchTerm.toLowerCase();
      const matchesSearch = (p.projectName || p.name || "").toLowerCase().includes(query) || currentProjId.toLowerCase().includes(query);
      const statusMap = {
        all: true,
        planning: p.status?.toString().toLowerCase() === "planning",
        "in progress": p.status?.toString().toLowerCase() === "in progress",
        "on hold": p.status?.toString().toLowerCase() === "on hold",
        completed: p.status?.toString().toLowerCase() === "completed",
        cancelled: p.status?.toString().toLowerCase() === "cancelled" || p.status?.toString().toLowerCase() === "cancel"
      };
      const matchesStatus = statusMap[statusFilter.toLowerCase()] ?? true;
      const matchesId = !projectId || currentProjId === projectId;
      return matchesSearch && matchesStatus && matchesId;
    })
    .sort((a, b) => {
      const idA = a._id || a.id || "";
      const idB = b._id || b.id || "";
      const timeA = a.createdAt || a.date ? new Date(a.createdAt || a.date).getTime() : getDateFromObjectId(idA);
      const timeB = b.createdAt || b.date ? new Date(b.createdAt || b.date).getTime() : getDateFromObjectId(idB);
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

  const filterOptions = [
    { id: "All", label: "All Statuses" },
    { id: "Planning", label: "Planning" },
    { id: "In Progress", label: "In Progress" },
    { id: "On Hold", label: "On Hold" },
    { id: "Completed", label: "Completed" },
    { id: "Cancelled", label: "Cancelled" }
  ];
  const currentActiveOption = filterOptions.find((opt) => opt.id === statusFilter) || filterOptions[0];

  return (
    <div className={`min-h-screen w-full p-3 sm:p-6 transition-colors duration-300 overflow-x-hidden ${isDarkMode ? "bg-[#05091D] text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Header section */}
        <div className="flex flex-col gap-0.5 shrink-0 px-0.5">
          <h1 className={`text-xl sm:text-2xl lg:text-4xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Monitor Tasks Progress
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-[11px] sm:text-xs lg:text-sm">
            Track real-time workspace task performance, project metrics, and complete lifecycle logs.
          </p>
        </div>

        {/* Controls actions block */}
        {!loading && (
          <div className="w-full flex flex-col gap-2.5 md:flex-row md:items-center justify-between">

            {/* Search Element */}
            <div className="relative w-full md:w-72 lg:w-80 xl:w-96 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={15} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-9 bg-white dark:bg-[#11182B] border border-gray-200 dark:border-[#263149] rounded-xl outline-none text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm transition-all focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={11} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Status + Sort Controls */}
            <div className="flex flex-wrap xs:flex-nowrap items-center gap-2 w-full md:w-auto md:ml-auto">
              
              {/* Dropdown Filter */}
              <div className="relative flex-1 xs:flex-none xs:w-40 sm:w-48 shrink-0 z-50" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full h-10 flex items-center justify-between gap-1.5 px-3 bg-white dark:bg-[#11182B] border text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-white cursor-pointer focus:outline-none relative rounded-xl transition-all ${
                    isDropdownOpen ? "border-blue-500" : "border-gray-200 dark:border-[#263149]"
                  }`}
                >
                  <SlidersHorizontal size={13} className="hidden sm:block text-gray-400 dark:text-gray-500 shrink-0" />
                  <span className="flex-1 text-left truncate whitespace-nowrap">{currentActiveOption.label}</span>
                  <ChevronDown size={13} className={`text-gray-400 dark:text-gray-500 shrink-0 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#11182B] border border-gray-200 dark:border-[#263149] rounded-xl shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100 origin-top min-w-[140px]">
                    {filterOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setStatusFilter(option.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-[11px] sm:text-xs cursor-pointer transition-colors ${
                          statusFilter === option.id
                            ? "bg-blue-600 text-white font-semibold"
                            : "text-gray-700 dark:text-gray-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600"
                        }`}
                      >
                        <span className="truncate whitespace-nowrap">{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort order toggle */}
              <div className="flex items-center flex-1 xs:flex-none bg-white dark:bg-[#11182B] border border-gray-200 dark:border-[#263149] rounded-xl p-1 shadow-sm shrink-0 min-w-[150px]">
                <button
                  type="button"
                  onClick={() => setSortOrder("newest")}
                  className={`flex-1 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                    sortOrder === "newest"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <CalendarDays size={12} className="shrink-0" />
                  <span className="whitespace-nowrap">Newest</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSortOrder("oldest")}
                  className={`flex-1 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                    sortOrder === "oldest"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <History size={12} className="shrink-0" />
                  <span className="whitespace-nowrap">Oldest</span>
                </button>
              </div>

              {/* View mode desktop view) */}
              <div className="hidden sm:flex items-center bg-white dark:bg-[#11182B] border border-gray-200 dark:border-[#263149] rounded-xl p-1 shadow-sm shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("detailed")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 text-xs font-bold whitespace-nowrap ${
                    viewMode === "detailed"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Rows size={14} className="shrink-0" />
                  <span>List</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("compact")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 text-xs font-bold whitespace-nowrap ${
                    effectiveViewMode === "compact"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <LayoutGrid size={14} className="shrink-0" />
                  <span>Grid</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Dynamic Project Progress Cards Container */}
        <div className="w-full min-w-0">
          {loading ? (
            <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-12 sm:p-24 text-center text-gray-400 dark:text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-wider animate-pulse">
              Loading dynamic track status records metadata...
            </div>
          ) : filteredAndSortedProjects.length > 0 ? (
            <div className={viewMode === "compact" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full" : "space-y-3 sm:space-y-4 w-full"}>
              {filteredAndSortedProjects.map((project) => (
                <TaskProgressCard key={project.id || project._id} project={project} viewMode={effectiveViewMode} />
              ))}
            </div>
          ) : (
            <div className="w-full min-h-[300px] sm:min-h-[350px] border-2 border-dashed border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded-[2rem] sm:rounded-[2.5rem] py-16 sm:py-28 px-5 sm:px-16 flex flex-col items-center justify-center text-center select-none col-span-full">
              <div className="text-gray-300 dark:text-slate-600 mb-4 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-gray-100 dark:border-slate-800/60 shadow-inner">
                <LineChart size={28} strokeWidth={1.5} className="text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300 tracking-tight">
                No monitored projects available
              </h3>
              <p className="text-[11px] font-medium text-gray-400 dark:text-slate-500 mt-1 max-w-sm">
                There are currently no active workspace items matching this view tracker.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MonitorTaskProgress;
