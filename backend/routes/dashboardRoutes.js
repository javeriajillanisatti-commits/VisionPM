const express = require("express");
const router = express.Router();

const {
  dashboard,
  getDashboardStats,
} = require("../controllers/dashboardController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// Project Admin dashboard endpoint
router.get("/", protect, dashboard);

// Project Manager workspace stats endpoint
router.get(
  "/stats/:workspaceId",
  protect,
  authorize("Project Manager", "Project Admin"),
  getDashboardStats
);

module.exports = router;