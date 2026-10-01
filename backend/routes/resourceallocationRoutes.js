const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const resourceAllocationController = require("../controllers/resourceallocationController");

// Smart resource allocation
router.post(
  "/suggest-members",
  protect,
  authorize("Project Manager"),
  resourceAllocationController.getSuggestedMembers
);

module.exports = router;