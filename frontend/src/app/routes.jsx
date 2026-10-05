import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

import LandingPage from "../pages/public/LandingPage";
import LoginPage from "../pages/public/LoginPage";
import SignupPage from "../pages/public/SignupPage";
import ForgotPassword from "../pages/public/ForgotPassword";
import ResetPasswordPage from "../pages/public/Reset";
import VerifyEmail from "../pages/VerifyEmail";

import Approvals from "../pages/super-admin/Approvals";
import MessagePage from "../pages/super-admin/MessagePage";

import AdminDashboard from "../pages/project-admin/AdminDashboard";
import ManageUsers from "../pages/project-admin/ManageUser";
import ManageWorkspaces from "../pages/project-admin/ManageWorkspaces";
import AdminProjects from "../pages/project-admin/AdminProjects";
import AdminTasks from "../pages/project-admin/AdminTasks";
import MonitorProjectsandTasks from "../pages/project-admin/MonitorProjectsandTasks";
import AdminReport from "../pages/project-admin/AdminReport";
import AdminAuditTrail from "../pages/project-admin/AdminAuditTrail";
import Announcements from "../pages/project-admin/Announcements";
import WorkspaceProjectMap from "../pages/project-admin/WorkspaceProjectMap";

import Dashboard from "../pages/project-manager/Dashboard";
import Workspaces from "../pages/project-manager/Workspaces";
import Projects from "../pages/project-manager/Projects";
import Tasks from "../pages/project-manager/Tasks";
import TaskDetails from "../pages/project-manager/TaskDetails";
import Members from "../pages/project-manager/Members";
import MonitorTaskProgress from "../pages/project-manager/MonitorTaskProgress";
import Report from "../pages/project-manager/Report";

import MemberWorkspace from "../pages/team-member/TM-Workspace";
import TMProjects from "../pages/team-member/TMProjects";
import TMTasks from "../pages/team-member/TM-Tasks";
import TMTaskDetail from "../pages/team-member/TM-TaskDetail";
import MemberReport from "../pages/team-member/TM-Report";
import TMWorkPlanner from "../pages/team-member/TM-WorkPlanner";
import TMContribution from "../pages/team-member/TM-Contribution";

const AppRoutes = () => (
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

export default AppRoutes;