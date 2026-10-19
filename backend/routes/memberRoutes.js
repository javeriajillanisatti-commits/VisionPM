const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getMyWorkspace,
  getMyProjects,
  getMyTasks,
} = require("../controllers/memberController");

// Team Member workspace
router.get(
  "/workspace",
  protect,
  authorize("Team Member"),
  getMyWorkspace
);

// Team Member projects
router.get(
  "/projects",
  protect,
  authorize("Team Member"),
  getMyProjects
);

// Team Member tasks
router.get(
  "/tasks",
  protect,
  authorize("Team Member"),
  getMyTasks
);

module.exports = router;