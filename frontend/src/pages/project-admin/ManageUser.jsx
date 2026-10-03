import { useLiveTick } from "../../hooks/useLiveRefresh";
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import UserTable from "../../components/admin/UserTable";
import UserQuickViewDrawer from "../../components/admin/UserQuickViewDrawer";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useTheme } from "../../context/ThemeContext";
import {
  Search,
  ChevronDown,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from "lucide-react";

const USERS_PER_PAGE = 8;

const ManageUsers = () => {
  const liveTick = useLiveTick({ resources: ["users", "workspaces", "projects"] });
  const { activeWorkspace, workspaceReady } = useWorkspace();
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [quickViewData, setQuickViewData] = useState(null);
  const [quickViewLoading, setQuickViewLoading] = useState(false);
  const [quickViewError, setQuickViewError] = useState(null);
  const [showActivities, setShowActivities] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  const workspaceId = activeWorkspace?.id || activeWorkspace?._id || "";
  const requestIdRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      if (!workspaceReady) return;

      hasLoadedOnceRef.current ? setIsRefreshing(true) : setIsLoading(true);

      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/users?search=${encodeURIComponent(
          debouncedSearchTerm
        )}&workspaceId=${workspaceId}&_=${Date.now()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (requestId !== requestIdRef.current) return;

      setUsers(data?.users || []);
      setError(null);
      hasLoadedOnceRef.current = true;
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      console.error("Error fetching users:", err);
      setError(
        err.response?.status === 401
          ? "Your session has expired. Please log in again."
          : err.code === "ERR_NETWORK"
          ? "Couldn't connect to the server. Check your connection."
          : "Failed to load users. Please try again."
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [debouncedSearchTerm, workspaceId, workspaceReady]);

  useEffect(() => {
    if (!workspaceReady) return;

    fetchUsers()
    const token = sessionStorage.getItem("token");
    let socket;

    if (token) {
      socket = io(process.env.REACT_APP_API_URL, { auth: { token } });

      socket.on("userStatusChanged", ({ userId, isOnline }) => {
        const updateUser = user =>
          String(user._id) === String(userId) ? { ...user, isOnline } : user;

        setUsers(current => current.map(updateUser));
        setSelectedUser(current =>
          current && String(current._id) === String(userId)
            ? { ...current, isOnline }
            : current
        );
      });

      socket.on("connect_error", err =>
        console.error("User status socket connection error:", err.message)
      );
    }

    const handleStatus = () => fetchUsers();
    const handleStorage = e =>
      e.key === "userStatusChanged" && fetchUsers();
    const handleFocus = () => fetchUsers();
    const handleVisibility = () =>
      !document.hidden && fetchUsers();

    window.addEventListener("userStatusChanged", handleStatus);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {

      socket?.off("userStatusChanged");
      socket?.disconnect();
      window.removeEventListener("userStatusChanged", handleStatus);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchUsers, workspaceReady, liveTick]);

  useEffect(() => setCurrentPage(1), [debouncedSearchTerm, roleFilter]);

  const filteredUsers = users.filter(
    user =>
      roleFilter === "All Roles" ||
      (user.role || "Team Member").toString().trim().toLowerCase() ===
        roleFilter.toLowerCase()
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortField) return 0;

    const comparison =
      sortField === "user"
        ? String(a.fullName || "")
            .toLowerCase()
            .localeCompare(String(b.fullName || "").toLowerCase())
        : sortField === "status"
        ? Number(a.isOnline) - Number(b.isOnline)
        : 0;

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(sortedUsers.length / USERS_PER_PAGE)
  );
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const paginatedUsers = sortedUsers.slice(
    startIndex,
    startIndex + USERS_PER_PAGE
  );

  const handleSort = field => {
    setSortField(field);
    setSortDirection(current =>
      sortField === field && current === "asc" ? "desc" : "asc"
    );
    setCurrentPage(1);
  };

  const goToPage = page => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleRetry = () => {
    setError(null);
    fetchUsers();
  };

  const handleUserClick = async user => {
    setSelectedUser(user);
    setQuickViewData(null);
    setQuickViewError(null);
    setQuickViewLoading(true);
    setShowActivities(false);

    try {
      const token = sessionStorage.getItem("token");
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/users/${user._id}/quick-view`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuickViewData(data);
    } catch (err) {
      console.error("Error fetching user quick view:", err);
      setQuickViewError(
        err.response?.data?.message || "Failed to load user details."
      );
    } finally {
      setQuickViewLoading(false);
    }
  };

  const closeDrawer = () => {
    setSelectedUser(null);
    setQuickViewData(null);
    setQuickViewError(null);
    setShowActivities(false);
  };

  const recentActivities =
    quickViewData?.data?.recentActivity
      ?.filter(
        ({ action }) =>
          !["login", "logout"].includes(
            String(action || "").toLowerCase().trim()
          )
      )
      .filter(
        (activity, index, arr) =>
          index ===
          arr.findIndex(
            item =>
              `${item.action}|${item.module}|${item.targetId}|${item.targetName}` ===
              `${activity.action}|${activity.module}|${activity.targetId}|${activity.targetName}`
          )
      ) || [];

  const inputClass = isDarkMode
    ? "bg-[#0b1329]/80 border-white/10 text-gray-200 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none hover:border-white/20"
    : "bg-white/80 border-gray-200/90 text-gray-800 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none hover:border-gray-300";

  const pageButtonClass = isDarkMode
    ? "bg-[#0b1329]/60 border-white/10 hover:bg-white/10 text-gray-300"
    : "bg-white/80 border-gray-200/80 hover:bg-gray-100 text-gray-700";

  const roleOptions = [
    "All Roles",
    "Project Manager",
    "Team Member"
  ];

  return (
    <div
      className={`w-full min-w-0 max-w-full min-h-screen overflow-x-hidden px-3 min-[430px]:px-4 sm:px-6 lg:px-10 pt-4 sm:pt-5 pb-8 sm:pb-12 transition-colors duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-[#030712] via-[#060d1f] to-[#040612] text-gray-100"
          : "bg-gradient-to-br from-gray-50 via-slate-50/50 to-white text-gray-900"
      }`}
    >
      <div className="mb-5 sm:mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 lg:gap-6 min-w-0">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
            Manage Users
          </h1>
          <p
            className={`mt-1.5 text-xs sm:text-sm leading-relaxed max-w-2xl break-words ${
              isDarkMode ? "text-gray-400 font-light" : "text-gray-500"
            }`}
          >
            Manage workspace users, roles and account status effortlessly.
          </p>
        </div>

        <div className="w-full lg:w-auto min-w-0 flex flex-col min-[600px]:flex-row items-stretch min-[600px]:items-center gap-2.5 sm:gap-3 lg:ml-auto">
          <div className="relative w-full min-[600px]:w-[320px] max-w-full group shrink-0">
            <Search
              size={17}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                isDarkMode
                  ? "text-gray-500 group-focus-within:text-blue-400"
                  : "text-gray-400 group-focus-within:text-blue-500"
              }`}
            />

            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
                autoComplete="off"
              className={`w-full h-11 pl-10 pr-9 rounded-xl border outline-none text-sm transition-all shadow-xs ${inputClass}`}
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
                  isDarkMode
                    ? "bg-white/10 hover:bg-white/20 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="relative w-full min-[600px]:w-[170px] shrink-0">
            <button
              type="button"
              onClick={() => setRoleOpen(current => !current)}
              className={`appearance-none w-full h-11 px-3.5 pr-9 rounded-xl border outline-none text-sm font-medium shadow-xs cursor-pointer transition-all ${inputClass} flex items-center justify-between text-left`}
            >
              <span className="truncate">{roleFilter}</span>
              <ChevronDown
                size={16}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 ${
                  roleOpen ? "rotate-180" : ""
                } ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              />
            </button>

            {roleOpen && (
              <div
                className={`absolute z-50 mt-1 w-full rounded-xl border shadow-lg overflow-hidden ${
                  isDarkMode
                    ? "bg-[#11182B] border-[#263149]"
                    : "bg-white border-gray-200"
                }`}
              >
                {roleOptions.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setRoleFilter(role);
                      setRoleOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm ${
                      roleFilter === role
                        ? "bg-blue-600 text-white"
                        : isDarkMode
                        ? "text-gray-300 hover:bg-[#1B253B]"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div
          className={`flex flex-col min-[430px]:flex-row items-start min-[430px]:items-center justify-between gap-3 sm:gap-4 mb-5 px-3.5 sm:px-5 py-3.5 sm:py-4 rounded-xl border shadow-sm min-w-0 ${
            isDarkMode
              ? "bg-red-950/30 border-red-500/20 text-red-300 backdrop-blur-md"
              : "bg-red-50/80 border-red-200/60 text-red-600 backdrop-blur-md"
          }`}
        >
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <AlertTriangle
              size={18}
              className="text-red-500 shrink-0 mt-0.5 sm:mt-0"
            />
            <span className="text-sm font-medium break-words min-w-0">
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRetry}
            className={`text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors shrink-0 ${
              isDarkMode
                ? "bg-red-500/20 hover:bg-red-500/30 text-red-200"
                : "bg-red-100 hover:bg-red-200 text-red-700"
            }`}
          >
            Retry
          </button>
        </div>
      )}

      <UserTable
        users={paginatedUsers}
        isLoading={isLoading}
        hasError={!!error}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onUserClick={handleUserClick}
      />

      {!isLoading && !error && filteredUsers.length > USERS_PER_PAGE && (
        <div className="flex flex-col min-[430px]:flex-row items-start min-[430px]:items-center justify-between gap-3 mt-5 sm:mt-6 px-1 sm:px-2 min-w-0">
          <span
            className={`text-xs sm:text-sm font-medium leading-relaxed break-words ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Showing <span className="font-semibold">{startIndex + 1}</span>–
            <span className="font-semibold">
              {Math.min(startIndex + USERS_PER_PAGE, sortedUsers.length)}
            </span>{" "}
            of <span className="font-semibold">{sortedUsers.length}</span> users
            {isRefreshing && (
              <span className="text-blue-400 animate-pulse ml-1">
                · Refreshing…
              </span>
            )}
          </span>

          <div className="w-full min-[430px]:w-auto max-w-full overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5 w-max">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`w-9 h-9 flex items-center justify-center rounded-xl border text-sm disabled:opacity-30 transition-all shrink-0 ${pageButtonClass}`}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  type="button"
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs shrink-0 ${
                    page === currentPage
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-500/25 ring-2 ring-blue-500/30"
                      : `border ${pageButtonClass}`
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`w-9 h-9 flex items-center justify-center rounded-xl border text-sm disabled:opacity-30 transition-all shrink-0 ${pageButtonClass}`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <UserQuickViewDrawer
        selectedUser={selectedUser}
        quickViewData={quickViewData}
        quickViewLoading={quickViewLoading}
        quickViewError={quickViewError}
        recentActivities={recentActivities}
        showActivities={showActivities}
        setShowActivities={setShowActivities}
        onClose={closeDrawer}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default ManageUsers;
