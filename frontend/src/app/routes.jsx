import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import PageSkeleton from "../components/common/PageSkeleton";

import LandingPage from "../pages/public/LandingPage";
import LoginPage from "../pages/public/LoginPage";
const SignupPage = lazy(() => import("../pages/public/SignupPage"));
const ForgotPassword = lazy(() => import("../pages/public/ForgotPassword"));
const ResetPasswordPage = lazy(() => import("../pages/public/Reset"));
const VerifyEmail = lazy(() => import("../pages/VerifyEmail"));

const Approvals = lazy(() => import("../pages/super-admin/Approvals"));
const MessagePage = lazy(() => import("../pages/super-admin/MessagePage"));

const AdminDashboard = lazy(() => import("../pages/project-admin/AdminDashboard"));
const ManageUsers = lazy(() => import("../pages/project-admin/ManageUser"));
const ManageWorkspaces = lazy(() => import("../pages/project-admin/ManageWorkspaces"));
const AdminProjects = lazy(() => import("../pages/project-admin/AdminProjects"));
const AdminTasks = lazy(() => import("../pages/project-admin/AdminTasks"));
const MonitorProjectsandTasks = lazy(() => import("../pages/project-admin/MonitorProjectsandTasks"));
const AdminReport = lazy(() => import("../pages/project-admin/AdminReport"));
const AdminAuditTrail = lazy(() => import("../pages/project-admin/AdminAuditTrail"));
const Announcements = lazy(() => import("../pages/project-admin/Announcements"));
const WorkspaceProjectMap = lazy(() => import("../pages/project-admin/WorkspaceProjectMap"));

const Dashboard = lazy(() => import("../pages/project-manager/Dashboard"));
const Workspaces = lazy(() => import("../pages/project-manager/Workspaces"));
const Projects = lazy(() => import("../pages/project-manager/Projects"));
const Tasks = lazy(() => import("../pages/project-manager/Tasks"));
const TaskDetails = lazy(() => import("../pages/project-manager/TaskDetails"));
const Members = lazy(() => import("../pages/project-manager/Members"));
const MonitorTaskProgress = lazy(() => import("../pages/project-manager/MonitorTaskProgress"));
const Report = lazy(() => import("../pages/project-manager/Report"));

const MemberWorkspace = lazy(() => import("../pages/team-member/TM-Workspace"));
const TMProjects = lazy(() => import("../pages/team-member/TMProjects"));
const TMTasks = lazy(() => import("../pages/team-member/TM-Tasks"));
const TMTaskDetail = lazy(() => import("../pages/team-member/TM-TaskDetail"));
const MemberReport = lazy(() => import("../pages/team-member/TM-Report"));
const TMWorkPlanner = lazy(() => import("../pages/team-member/TM-WorkPlanner"));
const TMContribution = lazy(() => import("../pages/team-member/TM-Contribution"));

// Download the other pages of the user's role quietly in the background,
// so moving between pages is instant (no wait for page code).
const prefetchLoaders = {
  superadmin: [
    () => import("../pages/super-admin/Approvals"),
    () => import("../pages/super-admin/MessagePage"),
  ],
  projectadmin: [
    () => import("../pages/project-admin/AdminDashboard"),
    () => import("../pages/project-admin/ManageUser"),
    () => import("../pages/project-admin/ManageWorkspaces"),
    () => import("../pages/project-admin/AdminProjects"),
    () => import("../pages/project-admin/AdminTasks"),
    () => import("../pages/project-admin/MonitorProjectsandTasks"),
    () => import("../pages/project-admin/AdminReport"),
    () => import("../pages/project-admin/AdminAuditTrail"),
    () => import("../pages/project-admin/Announcements"),
    () => import("../pages/project-admin/WorkspaceProjectMap"),
  ],
  projectmanager: [
    () => import("../pages/project-manager/Dashboard"),
    () => import("../pages/project-manager/Workspaces"),
    () => import("../pages/project-manager/Projects"),
    () => import("../pages/project-manager/Tasks"),
    () => import("../pages/project-manager/TaskDetails"),
    () => import("../pages/project-manager/Members"),
    () => import("../pages/project-manager/MonitorTaskProgress"),
    () => import("../pages/project-manager/Report"),
  ],
  teammember: [
    () => import("../pages/team-member/TM-Workspace"),
    () => import("../pages/team-member/TMProjects"),
    () => import("../pages/team-member/TM-Tasks"),
    () => import("../pages/team-member/TM-TaskDetail"),
    () => import("../pages/team-member/TM-Report"),
    () => import("../pages/team-member/TM-WorkPlanner"),
    () => import("../pages/team-member/TM-Contribution"),
  ],
};

const prefetchPages = () => {
  const token = sessionStorage.getItem("token");
  if (!token) return;
  const role = (sessionStorage.getItem("role") || "").toLowerCase().replace(/[\s_-]+/g, "");
  const loaders = prefetchLoaders[role] || [];
  const run = () => loaders.forEach((load, i) => setTimeout(() => load().catch(() => {}), i * 150));
  if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 1500);
};

if (typeof window !== "undefined") {
  window.addEventListener("userAuthenticated", prefetchPages);
  if (document.readyState === "complete") prefetchPages();
  else window.addEventListener("load", prefetchPages);
}

const AppRoutes = () => (
  <Suspense fallback={<PageSkeleton fullScreen />}>
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
  </Suspense>
);

export default AppRoutes;