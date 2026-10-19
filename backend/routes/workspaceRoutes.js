const express = require("express");
const router = express.Router();

const {
  createWorkspace,
  getAllWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMonitorData,
  getWorkspaceMembersWithProjects,
  getWorkspaceProjectMap,
  getProjectHealth,
} = require("../controllers/workspaceController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Protect all workspace routes
router.use(protect);

// Workspace management
router.post("/", authorize("Project Admin"), createWorkspace);
router.get(
  "/",
  authorize("Project Admin", "Project Manager", "Team Member"),
  getAllWorkspaces
);
router.get(
  "/:id",
  authorize("Project Admin", "Project Manager"),
  getWorkspaceById
);
router.put("/:id", authorize("Project Admin"), updateWorkspace);
router.delete("/:id", authorize("Project Admin"), deleteWorkspace);

// Workspace monitoring
router.get(
  "/:id/monitor",
  authorize("Project Admin", "Project Manager"),
  getWorkspaceMonitorData
);

// Workspace health and project map
router.get("/:id/health", authorize("Project Admin"), getProjectHealth);
router.get(
  "/:id/project-map",
  authorize("Project Admin"),
  getWorkspaceProjectMap
);

// Workspace members and projects
router.get(
  "/:id/members-projects",
  authorize("Project Manager"),
  getWorkspaceMembersWithProjects
);

module.exports = router;