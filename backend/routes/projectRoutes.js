const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { protect } = require("../middleware/authMiddleware");

// Project routes

router.post("/", protect, projectController.createProject);
router.get("/", protect, projectController.getDashboardProjects);
router.get(
  "/workspace/:workspaceId",
  protect,
  projectController.getProjectsByWorkspace
);

// Project reports and members
router.get(
  "/report/:projectId",
  protect,
  projectController.getProjectReport
);
router.get(
  "/:id/members",
  protect,
  projectController.getWorkspaceMembers
);
router.get(
  "/:id/assigned-members",
  protect,
  projectController.getProjectMembers
);
router.put(
  "/:id/members",
  protect,
  projectController.updateProjectMembers
);

// Project management

router.get("/:id", protect, projectController.getProjectById);
router.put("/:id", protect, projectController.updateProject);
router.delete("/:id", protect, projectController.deleteProject);
module.exports = router;