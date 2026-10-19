const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const { protect } = require("../middleware/authMiddleware");

// Check if the comment method is available before using it
if (commentController && commentController.getTaskComments) {
  router.get("/task/:taskId", protect, commentController.getTaskComments);
} else {
  // Use a fallback if the controller is not available yet
  router.get("/task/:taskId", protect, async (req, res, next) => {
    try {
      const controllerInline = require("../controllers/commentController");
      return controllerInline.getTaskComments(req, res, next);
    } catch (err) {
      return res.status(500).json({ message: "Chat controller initialization pending." });
    }
  });
}

module.exports = router;