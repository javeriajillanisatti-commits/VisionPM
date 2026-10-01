const express = require("express");

const {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
} = require("../controllers/announcementController");

const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/:workspaceId", protect, getAnnouncements);

router.post(
  "/:workspaceId",
  protect,
  upload.single("attachment"),
  createAnnouncement
);

router.delete(
  "/:workspaceId/:id",
  protect,
  deleteAnnouncement
);

module.exports = router;