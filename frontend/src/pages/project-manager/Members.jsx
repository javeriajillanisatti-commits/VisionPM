import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Search, AlertTriangle, SlidersHorizontal, Layers, CircleDot, Timer, Gauge, X } from "lucide-react";
import axios from "axios";
import MembersTable from "../../components/project/MembersTable";

const Members = () => {
  const liveTick = useLiveTick({ resources: ["workspaces", "users", "projects"] });
  const { activeWorkspace } = useWorkspace();
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const targetWorkspaceId = activeWorkspace?.id || activeWorkspace?._id;
    if (!targetWorkspaceId) return;

    let cancelled = false;
    let firstLoad = true;

    const fetchWorkspaceProjectMembers = async () => {
      const token = sessionStorage.getItem("token");
      if (!token || token === "null" || token === "undefined") return;

      try {
        if (firstLoad) setLoading(true);

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/workspaces/${targetWorkspaceId}/members-projects`,
           { headers: { Authorization: `Bearer ${token}` } }
         );

        if (!cancelled) {
          setMembers(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading project-based workspace members:", err);
        }
      } finally {
        if (firstLoad && !cancelled) setLoading(false);
        firstLoad = false;
      }
    };

    fetchWorkspaceProjectMembers();

    const handleFocus = () => fetchWorkspaceProjectMembers();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchWorkspaceProjectMembers();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeWorkspace, liveTick]);

  const filteredMembers = members
    .filter((m) => {
      const roleStr = (m.role || "").toLowerCase().trim();
      return roleStr !== "project manager" && roleStr !== "pm";
    })
    .filter((m) => {
      if (statusFilter === "All") return true;
      if (statusFilter === "Overloaded") return (m.workload || 0) > 100;
      return (m.availability || "").toLowerCase() === statusFilter.toLowerCase();
    })
    .filter((m) =>
      (m.fullName || m.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (a.fullName || a.name || "").localeCompare(b.fullName || b.name || ""));

  const getInitials = (name) => {
    if (!name) return "TM";
    return name.split(" ").map((n) => n).join("").toUpperCase().slice(0, 2);
  };

  const getWorkloadColor = (w) => {
    if (w <= 40) return "bg-green-500";
    if (w <= 74) return "bg-yellow-500";
    if (w <= 90) return "bg-orange-500";
    return "bg-red-500";
  };

  const filterTabs = [
    { id: "All", label: "All", icon: <Layers size={13} /> },
    { id: "Available", label: "Available", icon: <CircleDot size={13} className="text-cyan-500" /> },
    { id: "Busy", label: "Busy", icon: <Timer size={13} className="text-purple-500" /> },
    { id: "At Capacity", label: "At Capacity", icon: <Gauge size={13} className="text-orange-500" /> },
    { id: "Overloaded", label: "Overloaded", icon: <AlertTriangle size={13} className="text-red-700" /> },
  ];

  const renderFilterButton = (tab, mobile = false) => {
    const isActive = statusFilter === tab.id;
    return (
      <button
        key={tab.id}
        onClick={() => setStatusFilter(tab.id)}
        className={`${mobile ? "flex-1 min-w-0" : ""} px-2.5 sm:px-3 py-1.5 sm:py-2 min-h-8 sm:h-9 rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer border shadow-sm whitespace-nowrap ${
          isActive
            ? "bg-blue-600 border-blue-600 text-white shadow-blue-500/20"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
        }`}
      >
        {tab.icon}
        <span>{tab.label}</span>
      </button>
    );
  };

  return (
    <div className={`min-h-screen p-4 sm:p-6 transition-colors duration-300 ${
      isDarkMode ? "bg-[#05091D] text-white" : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Workspace Team Members
            </h1>
            <p className={`mt-2 text-xs sm:text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Monitor project allocation tracking, member capacity weights, and active utilization metrics.
            </p>
          </div>
        </div>

        {/* Filter and Search Actions Bar */}
        {!loading && members.length > 0 && (
          <div className="w-full pt-1 pb-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
              {/* Search */}
              <div className="relative w-full sm:w-64 lg:w-72 h-10 shrink-0">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-9 pr-9 rounded-xl border border-gray-200 dark:border-[#263149] bg-white dark:bg-[#11182B] text-sm text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all focus:border-blue-500"
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

              {/* Filters */}
              <div className="w-full sm:w-auto min-w-0">
                {/* Mobile only: Filter + All + Available on first line; remaining 3 on next line */}
                <div className="sm:hidden w-full space-y-1.5">
                  <div className="flex items-center gap-1.5 w-full">
                    <div className="flex items-center gap-1.5 px-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-500 whitespace-nowrap shrink-0">
                      <SlidersHorizontal size={13} className="text-slate-400" />
                      <span>Filter:</span>
                    </div>
                    {filterTabs.slice(0, 2).map((tab) => renderFilterButton(tab, true))}
                  </div>
                  <div className="flex items-center gap-1.5 w-full">
                    {filterTabs.slice(2).map((tab) => renderFilterButton(tab, true))}
                  </div>
                </div>

                {/* Desktop/tablet: existing single-row filter layout */}
                <div className="hidden sm:flex flex-wrap items-center justify-start sm:justify-end gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1.5 px-0.5 text-[11px] sm:text-[12px] font-bold text-slate-600 dark:text-slate-500 whitespace-nowrap shrink-0">
                    <SlidersHorizontal size={13} className="text-slate-400" />
                    <span>Filter:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                    {filterTabs.map((tab) => renderFilterButton(tab))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table layout view canvas */}
        <div className="w-full overflow-x-auto scrollbar-none">
          <div className="min-w-full inline-block align-middle">
            {loading ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-24 text-center text-gray-400 dark:text-slate-500 font-medium text-sm animate-pulse">
                Retrieving dynamic workspace members metadata...
              </div>
            ) : (
              <MembersTable
                filteredMembers={filteredMembers}
                getInitials={getInitials}
                getWorkloadColor={getWorkloadColor}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Members;
