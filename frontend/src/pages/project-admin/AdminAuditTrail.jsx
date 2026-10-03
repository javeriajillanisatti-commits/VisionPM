import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Search, Filter, CalendarDays, UserRound, Activity, Plus, Pencil,
  Trash2, ChevronLeft, ChevronRight, ClipboardList, CheckCircle,
  Clock, ChevronDown,
} from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useTheme } from "../../context/ThemeContext";
import StatsCard from "../../components/cards/StatsCard";

const ITEMS_PER_PAGE = 10;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];

const ACTION_STYLES = {
  Created: ["bg-emerald-500/10 text-emerald-400 border-emerald-500/20", "bg-emerald-50 text-emerald-700 border-emerald-200"],
  Updated: ["bg-blue-500/10 text-blue-400 border-blue-500/20", "bg-blue-50 text-blue-700 border-blue-200"],
  Deleted: ["bg-red-500/10 text-red-400 border-red-500/20", "bg-red-50 text-red-700 border-red-200"],
  Login: ["bg-indigo-500/10 text-indigo-400 border-indigo-500/20", "bg-indigo-50 text-indigo-700 border-indigo-200"],
};
const ACTION_ICONS = { Created: Plus, Upadated: Pencil, Deleted: Trash2 };

const getWorkspaceId = workspace =>
  typeof workspace === "object" ? workspace?._id || workspace?.id : workspace || null;

const pad2 = n => String(n).padStart(2, "0");


const formatDate = date => {
  if (!date) return { date: "-", time: "-" };
  const value = new Date(date);
  if (isNaN(value.getTime())) return { date: "-", time: "-" };
  return {
    date: value.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    time: value.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  };
};

const AdminAuditTrail = () => {
  const liveTick = useLiveTick({ resources: ["audit", "projects", "tasks", "users", "workspaces"] });
  const { activeWorkspace } = useWorkspace();
  const { isDarkMode } = useTheme();

  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [dateRange, setDateRange] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionOpen, setActionOpen] = useState(false);
  const [moduleOpen, setModuleOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(dateRange ? new Date(dateRange) : new Date());

  const selectedWorkspaceId = activeWorkspace?.id || activeWorkspace?._id || "";

  
  const fetchAuditLogs = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) return setAuditLogs([]);

      setLoading(true);
      const { data } = await axios.get(
  `${process.env.REACT_APP_API_URL}/api/audit`,
  {
        params: selectedWorkspaceId ? { workspaceId: selectedWorkspaceId } : {},
        headers: { Authorization: `Bearer ${token}` },
      });

      const logs = data.logs || [];
      setAuditLogs(
        selectedWorkspaceId
          ? logs.filter(log => String(getWorkspaceId(log.workspace)) === String(selectedWorkspaceId))
          : logs
      );
    } catch (error) {
      console.error("Error fetching audit logs:", error.response?.data || error);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspaceId]);

  useEffect(() => {
    setAuditLogs([]);
    setCurrentPage(1);
    fetchAuditLogs();
  }, [fetchAuditLogs, liveTick]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, actionFilter, moduleFilter, dateRange, selectedWorkspaceId]);

  const getActionStyle = action =>
    ACTION_STYLES[action]?.[isDarkMode ? 0 : 1] ||
    (isDarkMode ? "bg-gray-500/10 text-gray-400 border-gray-500/20" : "bg-gray-100 text-gray-600 border-gray-200");

  const getActionIcon = action => {
    const Icon = ACTION_ICONS[action] || Activity;
    return <Icon size={15} />;
  };

  const filteredLogs = useMemo(() => {
    const search = searchTerm.toLowerCase();
    const unique = new Map();

    auditLogs.forEach(log => {
      

      const userId = log.user?._id || log.user?.id || log.user?.email || "unknown";
      const key = `${userId}|${log.action}|${log.module}`;

      const values = [log.user?.fullName || "", log.user?.email || "", log.module || "", log.description || ""];
      const matchesSearch = values.some(value => value.toLowerCase().includes(search));
      const matchesAction = actionFilter === "All" || log.action === actionFilter;
      const matchesModule = moduleFilter === "All" || log.module === moduleFilter;

      let matchesDate = true;
      if (dateRange && log.createdAt) {
        const activityDate = new Date(log.createdAt);
        const selectedDate = new Date(dateRange);
        if (!isNaN(activityDate.getTime())) {
          selectedDate.setHours(0, 0, 0, 0);
          const nextDay = new Date(selectedDate);
          nextDay.setDate(nextDay.getDate() + 1);
          matchesDate = activityDate >= selectedDate && activityDate < nextDay;
        }
      }

      if (matchesSearch && matchesAction && matchesModule && matchesDate) {
        const existing = unique.get(key);
        if (!existing || new Date(log.createdAt) > new Date(existing.createdAt)) unique.set(key, log);
      }
    });

    return [...unique.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [auditLogs, searchTerm, actionFilter, moduleFilter, dateRange]);

  const totalActivities = filteredLogs.length;
  const createdCount = filteredLogs.filter(x => x.action === "Created").length;
  const updatedCount = filteredLogs.filter(x => x.action === "Updated").length;
  const deletedCount = filteredLogs.filter(x => x.action === "Deleted").length;

  const totalPages = Math.max(1, Math.ceil(totalActivities / ITEMS_PER_PAGE));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const changePage = direction =>
    setCurrentPage(page => (direction === "next" ? Math.min(totalPages, page + 1) : Math.max(1, page - 1)));

 
  const monthName = calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: firstDay + daysInMonth }, (_, i) => (i < firstDay ? null : i - firstDay + 1));

  const selectDate = day => {
    setDateRange(`${calendarDate.getFullYear()}-${pad2(calendarDate.getMonth() + 1)}-${pad2(day)}`);
    setDateOpen(false);
  };

  const changeMonth = direction =>
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + direction, 1));

  const closeDropdowns = (except) => {
    if (except !== "action") setActionOpen(false);
    if (except !== "module") setModuleOpen(false);
    if (except !== "date") setDateOpen(false);
  };

  
  const cardClass = `border rounded-2xl lg:rounded-3xl shadow-md transition-all duration-300 hover:shadow-lg ${
    isDarkMode ? "bg-[#0B1128] border-[#1E293B] hover:border-slate-700" : "bg-white border-gray-200 hover:border-gray-300"
  }`;
  const textClass = isDarkMode ? "text-white" : "text-gray-900";
  const mutedClass = isDarkMode ? "text-slate-400" : "text-gray-500";
  const filterClass = `w-full min-w-0 px-3 sm:px-4 py-2.5 rounded-xl lg:rounded-2xl text-sm outline-none transition-all ${
    isDarkMode ? "bg-[#05091D] border border-[#1E293B] text-slate-200 focus:border-blue-500" : "bg-gray-50 border border-gray-200 text-gray-700 focus:border-blue-400"
  }`;
  const searchClass = `w-full min-w-0 pl-10 pr-3 py-2.5 rounded-xl lg:rounded-2xl text-sm outline-none transition-all ${
    isDarkMode ? "bg-[#05091D] border border-[#1E293B] text-white placeholder:text-slate-500 focus:border-blue-500" : "bg-gray-50 border border-gray-200 text-gray-700 placeholder:text-gray-400 focus:border-blue-400"
  }`;
  const dropdownClass = isDarkMode ? "bg-[#11182B] border-[#263149]" : "bg-white border-gray-200";
  const optionClass = selected =>
    selected ? "bg-blue-600 text-white" : isDarkMode ? "text-gray-300 hover:bg-[#1B253B]" : "text-gray-700 hover:bg-gray-100";
  const iconBtnClass = isDarkMode ? "text-gray-300 hover:bg-[#1B253B]" : "text-gray-600 hover:bg-gray-100";
  const pageBtnClass = isDarkMode ? "border-[#263453] text-slate-300 hover:bg-[#111936]" : "border-gray-200 text-gray-600";

  const stats = [
    ["Total Activities", totalActivities, ClipboardList, "bg-gray-100 dark:bg-slate-800", "text-gray-600 dark:text-slate-300"],
    ["Created", createdCount, CheckCircle, "bg-emerald-50 dark:bg-emerald-500/10", "text-emerald-500"],
    ["Updated", updatedCount, Clock, "bg-blue-50 dark:bg-blue-500/10", "text-blue-500"],
    ["Deleted", deletedCount, Trash2, "bg-red-50 dark:bg-red-500/10", "text-red-500"],
  ];

  const headings = ["User", "Action", "Module", "Description", "Date & Time"];
  const actionOptions = [["All", "All Actions"], ["Created", "Created"], ["Updated", "Updated"], ["Deleted", "Deleted"]];
  const moduleOptions = [["All", "All Modules"], ["Project", "Project"], ["Task", "Task"], ["Authentication", "Authentication"]];

  const SkeletonRow = () => (
    <tr className={`border-b ${isDarkMode ? "border-[#1E293B]" : "border-gray-100"}`}>
      {[1, 2, 3, 4, 5].map(item => (
        <td key={item} className="px-4 py-3">
          <div className={`h-4 rounded-md animate-pulse ${item === 4 ? "w-40" : "w-24"} ${isDarkMode ? "bg-[#1E293B]" : "bg-gray-200"}`} />
        </td>
      ))}
    </tr>
  );

  return (
    <div className={`w-full min-h-screen overflow-x-hidden p-3 sm:p-5 lg:p-6 ${isDarkMode ? "bg-[#05091D]" : "bg-gray-50"}`}>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Activity Logs</h1>
        <p className={`text-sm mt-1.5 ${mutedClass}`}>Track important activities performed in the system.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {stats.map(([title, count, Icon, bgColor, iconColor]) => (
          <StatsCard key={title} title={title} count={count} icon={<Icon />} bgColor={bgColor} iconColor={iconColor} animate />
        ))}
      </div>

      {/* Filters */}
      <div className={`p-0 sm:p-4 lg:p-5 sm:border sm:rounded-2xl lg:rounded-3xl sm:shadow-md mb-4 ${isDarkMode ? "sm:bg-[#0B1128] sm:border-[#1E293B]" : "sm:bg-white sm:border-gray-200"}`}>
        <div className="flex items-center gap-2 mb-3">
          <Filter size={17} className="text-blue-500" />
          <h2 className={`font-semibold ${textClass}`}>Activity Filters</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative min-w-0 w-full">
            <Search size={17} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-slate-500" : "text-gray-400"}`} />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={searchClass}
            />
          </div>

          {/* Action filter */}
          <div className="relative min-w-0 w-full">
            <button
              type="button"
              onClick={() => { setActionOpen(v => !v); closeDropdowns("action"); }}
              className={`${filterClass} flex items-center justify-between gap-2 text-left cursor-pointer`}
            >
              <span className="truncate">{actionFilter === "All" ? "All Actions" : actionFilter}</span>
              <ChevronDown size={16} className={`shrink-0 transition-transform ${actionOpen ? "rotate-180" : ""}`} />
            </button>
            {actionOpen && (
              <div className={`absolute z-50 mt-1 w-full rounded-xl border shadow-lg overflow-hidden ${dropdownClass}`}>
                {actionOptions.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setActionFilter(value); setActionOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left text-sm ${optionClass(actionFilter === value)}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Module filter */}
          <div className="relative min-w-0 w-full">
            <button
              type="button"
              onClick={() => { setModuleOpen(v => !v); closeDropdowns("module"); }}
              className={`${filterClass} flex items-center justify-between gap-2 text-left cursor-pointer`}
            >
              <span className="truncate">{moduleFilter === "All" ? "All Modules" : moduleFilter}</span>
              <ChevronDown size={16} className={`shrink-0 transition-transform ${moduleOpen ? "rotate-180" : ""}`} />
            </button>
            {moduleOpen && (
              <div className={`absolute z-50 mt-1 w-full rounded-xl border shadow-lg overflow-hidden ${dropdownClass}`}>
                {moduleOptions.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setModuleFilter(value); setModuleOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left text-sm ${optionClass(moduleFilter === value)}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date filter */}
          <div className="relative min-w-0 w-full">
            <button
              type="button"
              onClick={() => { setDateOpen(v => !v); closeDropdowns("date"); if (!dateRange) setCalendarDate(new Date()); }}
              className={`${filterClass} flex items-center justify-between gap-2 text-left cursor-pointer`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <CalendarDays size={17} className="shrink-0 text-slate-500" />
                <span className="truncate">
                  {dateRange
                    ? new Date(`${dateRange}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "Select Date"}
                </span>
              </span>
              <ChevronDown size={16} className={`shrink-0 transition-transform ${dateOpen ? "rotate-180" : ""}`} />
            </button>

            {dateOpen && (
              <div className={`absolute z-50 mt-1 left-0 right-0 w-full max-w-full rounded-xl border shadow-lg overflow-hidden ${dropdownClass}`}>
                <div className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <button type="button" onClick={() => changeMonth(-1)} className={`p-1.5 rounded-lg ${iconBtnClass}`}>
                      <ChevronLeft size={17} />
                    </button>
                    <span className={`text-sm font-semibold ${textClass}`}>{monthName}</span>
                    <button type="button" onClick={() => changeMonth(1)} className={`p-1.5 rounded-lg ${iconBtnClass}`}>
                      <ChevronRight size={17} />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {WEEKDAYS.map(day => (
                      <span key={day} className={`text-center text-[11px] font-semibold py-1 ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}>
                        {day}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      const selected = day && dateRange === `${calendarDate.getFullYear()}-${pad2(calendarDate.getMonth() + 1)}-${pad2(day)}`;
                      return (
                        <button
                          key={index}
                          type="button"
                          disabled={!day}
                          onClick={() => day && selectDate(day)}
                          className={`aspect-square rounded-lg text-xs ${
                            !day ? "invisible" : selected ? "bg-blue-600 text-white" : isDarkMode ? "text-gray-300 hover:bg-[#1B253B]" : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  {dateRange && (
                    <button
                      type="button"
                      onClick={() => { setDateRange(""); setDateOpen(false); }}
                      className={`w-full mt-3 py-2 rounded-lg text-xs font-semibold ${iconBtnClass}`}
                    >
                      Clear Date
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeWorkspace && (
        <div className="mb-3 px-1">
          <p className={`text-xs ${mutedClass}`}>
            Showing activities for{" "}
            <span className="font-semibold text-blue-500">
              {activeWorkspace.name || activeWorkspace.workspaceName || "Selected Workspace"}
            </span>
          </p>
        </div>
      )}

      {/* Table */}
      <div className={`${cardClass} overflow-hidden`}>
        <div className={`px-4 sm:px-5 py-3 border-b flex items-center justify-between ${isDarkMode ? "border-[#1E293B]" : "border-gray-200"}`}>
          <div className="min-w-0">
            <h2 className={`font-semibold ${textClass}`}>Activity History</h2>
            <p className={`text-xs mt-1 ${mutedClass}`}>{filteredLogs.length} activities found</p>
          </div>
          <CalendarDays size={19} className={isDarkMode ? "text-slate-500" : "text-gray-400"} />
        </div>

        <div className="w-full overflow-x-auto min-[700px]:overflow-x-hidden">
          <table className="w-full min-w-[800px] min-[700px]:min-w-0">
            <thead>
              <tr className={`border-b ${isDarkMode ? "bg-[#111936] border-[#1E293B]" : "bg-gray-50 border-gray-200"}`}>
                {headings.map(heading => (
                  <th key={heading} className={`text-left px-4 py-3 text-sm font-semibold whitespace-nowrap ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} />)
              ) : paginatedLogs.length ? (
                paginatedLogs.map(log => {
                  const date = formatDate(log.createdAt);
                  return (
                    <tr key={log._id} className={`border-b transition ${isDarkMode ? "border-[#1E293B] hover:bg-[#111936]" : "border-gray-100 hover:bg-gray-50"}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isDarkMode ? "bg-indigo-500/10" : "bg-indigo-50"}`}>
                            <UserRound size={16} className="text-indigo-500" />
                          </div>
                          <div>
                            <p className={`text-sm font-medium whitespace-nowrap ${isDarkMode ? "text-slate-200" : "text-gray-800"}`}>
                              {log.user?.fullName || "Unknown User"}
                            </p>
                            <p className={`text-xs whitespace-nowrap ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}>
                              {log.user?.email || ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold ${getActionStyle(log.action)}`}>
                          {getActionIcon(log.action)}
                          {log.action}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>{log.module}</span>
                      </td>

                      <td className="px-4 py-3 min-w-[300px]">
                        <p className={`text-sm leading-5 ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>{log.description}</p>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>{date.date}</p>
                        <p className={`text-xs mt-1 ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}>{date.time}</p>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center">
                    <Activity size={28} className={`mx-auto mb-3 ${isDarkMode ? "text-slate-600" : "text-gray-300"}`} />
                    <p className={`text-sm font-medium ${mutedClass}`}>No activities found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredLogs.length > ITEMS_PER_PAGE && (
          <div className={`px-4 sm:px-5 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${isDarkMode ? "border-[#1E293B]" : "border-gray-200"}`}>
            <p className={`text-xs ${mutedClass}`}>
              Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changePage("previous")}
                disabled={currentPage === 1}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${currentPage === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50"} ${pageBtnClass}`}
              >
                <ChevronLeft size={15} />
                Previous
              </button>

              <button
                type="button"
                onClick={() => changePage("next")}
                disabled={currentPage === totalPages}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50"} ${pageBtnClass}`}
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditTrail;
