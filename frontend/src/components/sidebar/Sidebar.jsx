import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../components/assets/logo.png";
import {
  LayoutDashboard, Briefcase, Users, MonitorDot, FileText,
  ClipboardList, LogOut, X, MessageCircle, CalendarDays,
  UserRound, ChevronLeft, ChevronRight
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isOpen, setIsOpen, userRole }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logoutUser } = useAuth();

  const icon = (Icon) => <Icon size={20} />;
  const menuConfigs = {
    superadmin: [
      ["Approvals", "/super-admin/approvals", LayoutDashboard],
      ["Messages", "/super-admin/messages", MessageCircle]
    ],
    projectadmin: [
      ["Dashboard", "/project-admin/admin-dashboard", LayoutDashboard],
      ["User Management", "/project-admin/manage-user", Users],
      ["Workspaces Management", "/project-admin/manage-workspaces", Briefcase],
      ["Monitor Projects and Tasks", "/project-admin/monitor-projects-and-tasks", MonitorDot],
      ["Report", "/project-admin/admin-report", FileText],
      ["Activity Audit Trail", "/project-admin/audit-trail", ClipboardList]
    ],
    projectmanager: [
      ["Dashboard", "/project-manager/dashboard", LayoutDashboard],
      ["Workspaces", "/project-manager/workspaces", Briefcase],
      ["Members", "/project-manager/members", Users],
      ["Monitor Task Progress", "/project-manager/task-progress", MonitorDot],
      ["Report", "/project-manager/report", FileText]
    ],
    teammember: [
      ["Workspace", "/team-member/tm-workspace", Briefcase],
      ["Work Planner", "/team-member/work-planner", CalendarDays],
      ["Contribution", "/team-member/my-contribution", UserRound],
      ["Report", "/team-member/tm-report", FileText]
    ]
  };

  const menuItems = menuConfigs[userRole] || [];

  // Handle logout
  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <div>
      <div className={`fixed inset-y-0 left-0 z-[90] bg-white dark:bg-slate-900 h-screen border-r border-gray-100 dark:border-slate-800/80 flex flex-col transition-all duration-300 ease-in-out ${
        isOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full lg:translate-x-0 lg:w-20"
      }`}>
        <div className={`p-6 flex items-center justify-between border-b border-gray-50 dark:border-slate-800/60 relative ${
          !isOpen ? "lg:justify-center lg:px-2" : ""
        }`}>
          <div className="flex items-center space-x-3 min-w-0">
            <img src={logo} alt="Logo" className="h-8 w-auto shrink-0" />
            {isOpen && (
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-black dark:from-indigo-400 dark:to-white bg-clip-text text-transparent truncate animate-fadeIn">
                VisionPM
              </span>
            )}
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <X size={20} />
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden lg:flex absolute -right-3 top-7 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm p-1 rounded-full text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 z-[100] transition-transform active:scale-95"
            title={isOpen ? "Collapse Menu" : "Expand Menu"}
          >
            {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        <nav className={`flex-1 mt-6 space-y-2 overflow-y-auto custom-scrollbar ${isOpen ? "px-4" : "px-4 lg:px-2"}`}>
          {menuItems.map(([name, path, Icon]) => {
            const active = pathname === path;

            return (
              <Link
                key={path}
                to={path}
                onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                title={!isOpen ? name : ""}
                className={`flex items-center text-sm font-semibold rounded-2xl transition-all duration-300 group ${
                  isOpen ? "px-4 py-3.5" : "px-4 py-3.5 lg:justify-center lg:px-0 lg:h-11 lg:w-11 lg:mx-auto"
                } ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg scale-[1.02]"
                    : "text-gray-800 dark:text-slate-300 hover:bg-gradient-to-r hover:from-blue-600 hover:to-black dark:hover:to-slate-800 hover:text-white"
                }`}
              >
                <span className={`shrink-0 ${active ? "text-white" : "text-gray-800 dark:text-slate-400 group-hover:text-white"}`}>
                  {icon(Icon)}
                </span>
                {isOpen && <span className="ml-3 truncate animate-fadeIn">{name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`p-4 border-t border-gray-50 dark:border-slate-800/60 ${!isOpen ? "lg:px-2" : ""}`}>
          <button
            onClick={handleLogout}
            title={!isOpen ? "Logout" : ""}
            className={`flex items-center text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-2xl transition-all active:scale-95 ${
              isOpen ? "w-full px-4 py-3.5" : "w-full px-4 py-3.5 lg:justify-center lg:px-0 lg:h-11 lg:w-11 lg:mx-auto"
            }`}
          >
            <LogOut size={20} className="shrink-0" />
            {isOpen && <span className="ml-3 truncate animate-fadeIn">Logout</span>}
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-[80] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default Sidebar;