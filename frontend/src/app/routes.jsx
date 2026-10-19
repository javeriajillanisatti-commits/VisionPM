import { lazy, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import LandingPage from "../pages/public/LandingPage";
import LoginPage from "../pages/public/LoginPage";

const lazyPage = importer => {
  const Component = lazy(importer);
  Component.preload = importer;
  return Component;
};

const SignupPage = lazyPage(() => import("../pages/public/SignupPage"));
const ForgotPassword = lazyPage(() => import("../pages/public/ForgotPassword"));
const ResetPasswordPage = lazyPage(() => import("../pages/public/Reset"));
const VerifyEmail = lazyPage(() => import("../pages/VerifyEmail"));

const Approvals = lazyPage(() => import("../pages/super-admin/Approvals"));
const MessagePage = lazyPage(() => import("../pages/super-admin/MessagePage"));

const AdminDashboard = lazyPage(() => import("../pages/project-admin/AdminDashboard"));
const ManageUsers = lazyPage(() => import("../pages/project-admin/ManageUser"));
const ManageWorkspaces = lazyPage(() => import("../pages/project-admin/ManageWorkspaces"));
const AdminProjects = lazyPage(() => import("../pages/project-admin/AdminProjects"));
const AdminTasks = lazyPage(() => import("../pages/project-admin/AdminTasks"));
const MonitorProjectsandTasks = lazyPage(() => import("../pages/project-admin/MonitorProjectsandTasks"));
const AdminReport = lazyPage(() => import("../pages/project-admin/AdminReport"));
const AdminAuditTrail = lazyPage(() => import("../pages/project-admin/AdminAuditTrail"));
const Announcements = lazyPage(() => import("../pages/project-admin/Announcements"));
const WorkspaceProjectMap = lazyPage(() => import("../pages/project-admin/WorkspaceProjectMap"));

const Dashboard = lazyPage(() => import("../pages/project-manager/Dashboard"));
const Workspaces = lazyPage(() => import("../pages/project-manager/Workspaces"));
const Projects = lazyPage(() => import("../pages/project-manager/Projects"));
const Tasks = lazyPage(() => import("../pages/project-manager/Tasks"));
const TaskDetails = lazyPage(() => import("../pages/project-manager/TaskDetails"));
const Members = lazyPage(() => import("../pages/project-manager/Members"));
const MonitorTaskProgress = lazyPage(() => import("../pages/project-manager/MonitorTaskProgress"));
const Report = lazyPage(() => import("../pages/project-manager/Report"));

const MemberWorkspace = lazyPage(() => import("../pages/team-member/TM-Workspace"));
const TMProjects = lazyPage(() => import("../pages/team-member/TMProjects"));
const TMTasks = lazyPage(() => import("../pages/team-member/TM-Tasks"));
const TMTaskDetail = lazyPage(() => import("../pages/team-member/TM-TaskDetail"));
const MemberReport = lazyPage(() => import("../pages/team-member/TM-Report"));
const TMWorkPlanner = lazyPage(() => import("../pages/team-member/TM-WorkPlanner"));
const TMContribution = lazyPage(() => import("../pages/team-member/TM-Contribution"));


const lazyPages = [SignupPage, ForgotPassword, ResetPasswordPage, VerifyEmail, Approvals, MessagePage, AdminDashboard, ManageUsers, ManageWorkspaces, AdminProjects, AdminTasks, MonitorProjectsandTasks, AdminReport, AdminAuditTrail, Announcements, WorkspaceProjectMap, Dashboard, Workspaces, Projects, Tasks, TaskDetails, Members, MonitorTaskProgress, Report, MemberWorkspace, TMProjects, TMTasks, TMTaskDetail, MemberReport, TMWorkPlanner, TMContribution];

const AppRoutes = () => {
  useEffect(() => {
    const preloadAll = () => lazyPages.forEach(page => page.preload().catch(() => {}));
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(preloadAll, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(preloadAll, 2000);
    return () => clearTimeout(id);
  }, []);

  return (
  <Routes>
    {/* Public pages */}
    <Route element={<PublicLayout />}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
    </Route>

    {/* Super Admin pages */}
    <Route element={<ProtectedRoute allowedRoles={["super-admin"]} />}>
      <Route path="/super-admin" element={<MainLayout userRole="superadmin" />}>
        <Route index element={<Navigate to="approvals" />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="messages" element={<MessagePage />} />
      </Route>
    </Route>

    {/* Project Admin pages */}
    <Route element={<ProtectedRoute allowedRoles={["project-admin"]} />}>
      <Route path="/project-admin" element={<MainLayout userRole="projectadmin" />}>
        <Route index element={<Navigate to="admin-dashboard" />} />
        <Route path="admin-dashboard" element={<AdminDashboard />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="manage-user" element={<ManageUsers />} />
        <Route path="manage-workspaces" element={<ManageWorkspaces />} />
        <Route path="manage-workspaces/:workspaceId" element={<AdminProjects />} />
        <Route path="manage-workspaces/:workspaceId/projects/:projectId" element={<AdminTasks />} />
        <Route path="monitor-projects-and-tasks" element={<MonitorProjectsandTasks />} />
        <Route path="admin-report" element={<AdminReport />} />
        <Route path="audit-trail" element={<AdminAuditTrail />} />
        <Route path="workspace-map/:workspaceId" element={<WorkspaceProjectMap />} />
      </Route>
    </Route>

    {/* Project Manager pages */}
    <Route element={<ProtectedRoute allowedRoles={["project-manager"]} />}>
      <Route path="/project-manager" element={<MainLayout userRole="projectmanager" />}>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="workspaces" element={<Workspaces />} />
        <Route path="workspaces/:workspaceId" element={<Projects />} />
        <Route path="workspaces/:workspaceId/projects/:projectId" element={<Tasks />} />
        <Route path="workspaces/:workspaceId/projects/:projectId/tasks/:taskId" element={<TaskDetails />} />
        <Route path="members" element={<Members />} />
        <Route path="task-progress" element={<MonitorTaskProgress />} />
        <Route path="report" element={<Report />} />
      </Route>
    </Route>

    {/* Team Member pages */}
    <Route element={<ProtectedRoute allowedRoles={["team-member"]} />}>
      <Route path="/team-member" element={<MainLayout userRole="teammember" />}>
        <Route index element={<Navigate to="tm-workspace" />} />
        <Route path="tm-workspace" element={<MemberWorkspace />} />
        <Route path="tm-workspace/:workspaceId" element={<TMProjects />} />
        <Route path="tm-workspace/:workspaceId/projects/:projectId" element={<TMTasks />} />
        <Route path="tm-workspace/:workspaceId/projects/:projectId/tasks/:taskId" element={<TMTaskDetail />} />
        <Route path="work-planner" element={<TMWorkPlanner />} />
        <Route path="my-contribution" element={<TMContribution />} />
        <Route path="tm-report" element={<MemberReport />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
  );
};

export default AppRoutes;