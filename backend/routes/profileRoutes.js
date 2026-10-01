const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const {
  getProfile,
  updateProfile,
  verifyCurrentPassword,
  uploadProfilePic,
  upload,
} = require("../controllers/profileController");

// Profile routes
router.get("/", protect, getProfile);
router.put("/", protect, updateProfile);
router.post("/verify-password", protect, verifyCurrentPassword);
router.post(
  "/upload-pic",
  protect,
  upload.single("profilePic"),
  uploadProfilePic
);

module.exports = router;