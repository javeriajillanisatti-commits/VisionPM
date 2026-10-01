import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
  Sun,
  Moon,
  Megaphone,
} from "lucide-react";
import WorkspaceDropdown from "../topbar/WorkspaceDropdown";
import NotificationDropdown from "../topbar/NotificationDropdown";
import ProfileForm from "../forms/ProfileForm";
import NotificationDetailModal from "./NotificationDetailModal";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useTheme } from "../../context/ThemeContext";
import { getMyNotifications } from "../../services/notificationService";

const API_BASE =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

const NORMAL_NOTIFICATION_TYPES = [
  "TASK_ASSIGNED",
  "SUBTASK_ASSIGNED",
  "SUBTASK_COMPLETED",
  "TASK_MEMBER_COMPLETED",
  "STATUS_UPDATED",
  "DEADLINE",
  "ANNOUNCEMENT",
];

const Topbar = ({
  toggleSidebar,
  userRole,
}) => {
  const navigate = useNavigate();

  const cleanRole = userRole
    ?.toString()
    .toLowerCase()
    .replace(/\s+/g, "");

  const {
    isDarkMode,
    toggleThemeMode,
    setThemeRole,
  } = useTheme();

  const {
    activeWorkspace,
    setActiveWorkspace,
  } = useWorkspace();

  const [isProfileOpen, setIsProfileOpen] =
    useState(false);

  const [isNotifOpen, setIsNotifOpen] =
    useState(false);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [
    selectedNotification,
    setSelectedNotification,
  ] = useState(null);

  const [dbWorkspaces, setDbWorkspaces] =
    useState([]);

  const [userData, setUserData] = useState({
    name: "",
    fullName: "",
    email: "",
    role: "",
    profilePic: null,
    skills: "",
    workload: "",
    availability: "",
  });

  const showWorkspaceDropdown =
    cleanRole === "projectadmin";

  const showNotifications = [
    "projectmanager",
    "teammember",
  ].includes(cleanRole);

  const notificationTypes = useMemo(
    () =>
      cleanRole === "projectmanager" ||
      cleanRole === "teammember"
        ? NORMAL_NOTIFICATION_TYPES
        : [],
    [cleanRole]
  );

  useEffect(() => {
    setThemeRole(cleanRole);
  }, [cleanRole, setThemeRole]);

  const autoSelectWorkspace = useCallback(
    (userProfile, wsList) => {
      const savedWorkspace =
        localStorage.getItem(
          "activeWorkspace"
        );

      if (savedWorkspace) {
        try {
          const parsed =
            JSON.parse(savedWorkspace);

          const savedId =
            parsed?._id || parsed?.id;

          const matched = wsList.find(
            (workspace) =>
              String(
                workspace._id ||
                  workspace.id
              ) === String(savedId)
          );

          if (matched) {
            setActiveWorkspace(matched);
            return;
          }

          localStorage.removeItem(
            "activeWorkspace"
          );
        } catch {
          localStorage.removeItem(
            "activeWorkspace"
          );
        }
      }

      if (userProfile.workspace) {
        const profileWsId =
          userProfile.workspace?._id ||
          userProfile.workspace;

        const matched = wsList.find(
          (workspace) =>
            String(
              workspace._id ||
                workspace.id
            ) === String(profileWsId)
        );

        if (matched) {
          setActiveWorkspace(matched);

          localStorage.setItem(
            "activeWorkspace",
            JSON.stringify(matched)
          );

          return;
        }
      }

      setActiveWorkspace(null);
      localStorage.removeItem(
        "activeWorkspace"
      );
    },
    [setActiveWorkspace]
  );

  const loadProfileAndWorkspaces =
    useCallback(async () => {
      try {
        const token =
          sessionStorage.getItem("token") ||
          localStorage.getItem("token");

        if (!token) {
          console.error(
            "Authentication token not found."
          );
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const profileEndpoint =
          cleanRole === "superadmin"
            ? "/api/auth/me"
            : "/api/profile";

        const profileRes = await axios.get(
          `${API_BASE}${profileEndpoint}`,
          { headers }
        );

        const rawProfile =
          profileRes.data?.user ||
          profileRes.data?.data?.user ||
          profileRes.data?.profile ||
          profileRes.data?.data ||
          profileRes.data ||
          {};

        const userProfile = {
          ...rawProfile,

          name:
            rawProfile.fullName ||
            rawProfile.name ||
            rawProfile.full_name ||
            rawProfile.displayName ||
            "",

          fullName:
            rawProfile.fullName ||
            rawProfile.name ||
            rawProfile.full_name ||
            rawProfile.displayName ||
            "",

          email:
            rawProfile.email ||
            rawProfile.emailAddress ||
            "",

          role:
            rawProfile.role ||
            rawProfile.userRole ||
            userRole ||
            "",

          profilePic:
            rawProfile.profilePic ||
            rawProfile.profilePicture ||
            rawProfile.avatar ||
            null,
        };

        setUserData(userProfile);

        if (!showWorkspaceDropdown) {
          setDbWorkspaces([]);
          return;
        }

        const wsRes = await axios.get(
          `${API_BASE}/api/workspaces`,
          { headers }
        );

        const wsList =
          wsRes.data?.workspaces ||
          wsRes.data?.data?.workspaces ||
          wsRes.data?.data ||
          wsRes.data ||
          [];

        const workspaces = Array.isArray(wsList)
          ? wsList
          : [];

        setDbWorkspaces(workspaces);

        autoSelectWorkspace(
          userProfile,
          workspaces
        );
      } catch (err) {
        console.error(
          "Profile toolbar data syncing failure:",
          err.response?.data || err
        );
      }
    }, [
      autoSelectWorkspace,
      cleanRole,
      showWorkspaceDropdown,
      userRole,
    ]);

  useEffect(() => {
    if (activeWorkspace) {
      localStorage.setItem(
        "activeWorkspace",
        JSON.stringify(activeWorkspace)
      );
    } else {
      localStorage.removeItem(
        "activeWorkspace"
      );
    }
  }, [activeWorkspace]);

  useEffect(() => {
    if (!showNotifications) {
      setUnreadCount(0);
      return;
    }

    const loadUnreadCount = async () => {
      try {
        const data =
          await getMyNotifications();

        const list =
          data?.notifications || [];

        setUnreadCount(
          list.filter(
            (notification) =>
              notificationTypes.includes(
                notification.type
              ) && !notification.isRead
          ).length
        );
      } catch (err) {
        console.error(
          "Unread count load failure:",
          err
        );
      }
    };

    loadUnreadCount();
  }, [
    showNotifications,
    notificationTypes,
  ]);

  useEffect(() => {
    loadProfileAndWorkspaces();
  }, [loadProfileAndWorkspaces]);

  useEffect(() => {
    const handleWorkspaceListUpdated =
      () => loadProfileAndWorkspaces();

    window.addEventListener(
      "workspaceListUpdated",
      handleWorkspaceListUpdated
    );

    return () =>
      window.removeEventListener(
        "workspaceListUpdated",
        handleWorkspaceListUpdated
      );
  }, [loadProfileAndWorkspaces]);

  const getHeading = () => {
    switch (cleanRole) {
      case "superadmin":
        return "Super Admin";

      case "projectadmin":
        return "Project Admin Dashboard";

      case "projectmanager":
        return "Project Manager Dashboard";

      case "teammember":
        return "Team Member Workspace";

      default:
        return "VisionPM Dashboard";
    }
  };

  const getInitials = (name) => {
    if (!name?.trim()) return "?";

    const parts = name
      .trim()
      .split(/\s+/);

    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  const getProfilePicSrc = (pic) => {
    if (!pic) return null;

    return pic.startsWith("http") ||
      pic.startsWith("blob:")
      ? pic
      : `${API_BASE}${pic}`;
  };

  const handleNotificationClick =
    (notification) => {
      setIsNotifOpen(false);
      setSelectedNotification(
        notification
      );
    };

  return (
    <>
      <div
        className={`
          h-16 min-h-16 w-full
          bg-white dark:bg-[#0B1228]
          border-b border-gray-200 dark:border-[#1E2A45]
          flex items-center sticky top-0 z-40 shadow-sm
          transition-colors duration-300
          ${
            showWorkspaceDropdown
              ? "overflow-x-auto overflow-y-visible scrollbar-thin"
              : "overflow-hidden"
          }
        `}
      >
        <div
          className={`
            h-full w-full
            ${
              showWorkspaceDropdown
                ? "min-w-[420px] sm:min-w-0"
                : "min-w-0"
            }
            flex items-center justify-between gap-2
            px-2 sm:px-4 lg:px-6
          `}
        >
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={toggleSidebar}
              className="
                lg:hidden shrink-0 p-2 mr-1.5 sm:mr-3
                bg-indigo-50 dark:bg-[#111C38]
                border border-indigo-100 dark:border-[#263657]
                rounded-xl text-indigo-600 dark:text-blue-400
                hover:bg-indigo-100 dark:hover:bg-[#172443]
                transition-colors
              "
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>

            {showWorkspaceDropdown && (
              <div
                className="
                  shrink-0
                  w-[170px]
                  sm:w-[230px]
                  md:w-[280px]
                  lg:w-[320px]
                  relative z-[100]
                "
              >
                <WorkspaceDropdown
                  workspaces={dbWorkspaces}
                  userRole={userRole}
                />
              </div>
            )}
          </div>

          <div className="hidden md:flex flex-1 min-w-0 justify-center px-2">
            <div
              className="
                max-w-full bg-indigo-50 dark:bg-[#111C38]
                px-3 lg:px-4 py-1.5 rounded-full
                border border-indigo-100 dark:border-[#263657]
                overflow-hidden
              "
            >
              <h1
                className="
                  text-sm lg:text-lg font-bold truncate
                  bg-gradient-to-r from-indigo-600 to-black
                  dark:from-blue-400 dark:to-white
                  bg-clip-text text-transparent
                "
              >
                {getHeading()}
              </h1>
            </div>
          </div>

          <div className="flex items-center justify-end gap-0.5 sm:gap-2 shrink-0 ml-auto">
            <button
              type="button"
              onClick={toggleThemeMode}
              title={
                isDarkMode
                  ? "Switch to Light Mode"
                  : "Switch to Dark Mode"
              }
              className="
                shrink-0 p-2 rounded-xl
                border border-slate-200 dark:border-[#263657]
                bg-slate-50 dark:bg-[#111C38]
                text-slate-600 dark:text-slate-300
                hover:bg-slate-100 dark:hover:bg-[#172443]
                transition-all shadow-sm active:scale-95
              "
            >
              {isDarkMode ? (
                <Sun
                  size={18}
                  className="text-amber-400"
                />
              ) : (
                <Moon
                  size={18}
                  className="text-blue-700"
                />
              )}
            </button>

            {showNotifications && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setIsNotifOpen(
                      !isNotifOpen
                    )
                  }
                  className="
                    relative p-2 rounded-full
                    hover:bg-gray-100 dark:hover:bg-[#111C38]
                    transition-colors
                  "
                  title="Notifications"
                >
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-slate-300" />

                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </button>

                {isNotifOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() =>
                        setIsNotifOpen(false)
                      }
                    />

                    <div className="fixed right-2 sm:right-4 top-16 z-[60] w-max max-w-[calc(100vw-16px)]">
                      <NotificationDropdown
                        onClose={() =>
                          setIsNotifOpen(false)
                        }
                        onUnreadCountChange={
                          setUnreadCount
                        }
                        notificationTypes={
                          notificationTypes
                        }
                        onNotificationClick={
                          handleNotificationClick
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {cleanRole === "projectadmin" && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/project-admin/announcements"
                  )
                }
                title="Announcements"
                className="
                  shrink-0 p-2 rounded-full
                  hover:bg-gray-100 dark:hover:bg-[#111C38]
                  transition-colors
                "
              >
                <Megaphone className="w-5 h-5 text-gray-600 dark:text-slate-300" />
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setIsProfileOpen(true)
              }
              className="
                shrink-0 w-9 h-9 sm:w-10 sm:h-10
                bg-indigo-600 text-white rounded-full
                font-bold text-sm border-2 border-indigo-100
                dark:border-[#263657] shadow-sm
                flex items-center justify-center
                cursor-pointer active:scale-95
                transition-all overflow-hidden
              "
            >
              {userData.profilePic ? (
                <img
                  src={getProfilePicSrc(
                    userData.profilePic
                  )}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(
                  userData.fullName ||
                    userData.name
                )
              )}
            </button>
          </div>
        </div>
      </div>

      {isProfileOpen && (
        <div
          className="
            fixed inset-0 z-[100]
            flex items-center justify-center
            p-3 sm:p-4 bg-black/60 backdrop-blur-sm
            overflow-y-auto
          "
        >
          <div className="relative z-[110] w-full max-w-2xl my-auto">
            <ProfileForm
              onClose={() =>
                setIsProfileOpen(false)
              }
              userData={userData}
              setUserData={setUserData}
              userRole={userRole}
            />
          </div>
        </div>
      )}

      {selectedNotification && (
        <NotificationDetailModal
          notification={
            selectedNotification
          }
          onClose={() =>
            setSelectedNotification(null)
          }
        />
      )}
    </>
  );
};

export default Topbar;