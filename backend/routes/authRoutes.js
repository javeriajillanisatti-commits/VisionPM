const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const {
  signup,
  login,
  logout,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  pendingRequests,
  approveProjectAdmin,
  rejectProjectAdmin,
  getCVDetails,
} = require("../controllers/authController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Authentication routes
router.post("/signup", upload.single("cv"), signup);
router.post("/login", login);
router.post("/logout", protect, logout);

// Get protected session data
router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Protected Route Accessed",
    user: req.user,
  });
});

router.get("/me", protect, getMe);
router.get("/verify-email/:token", verifyEmail);

// Project Admin access
router.get("/admin", protect, authorize("Project Admin"), (req, res) => {
  res.json({ message: "Project Admin Access" });
});

// Super Admin access
router.get("/super-admin", protect, authorize("Super Admin"), (req, res) => {
  res.json({ message: "Super Admin Access" });
});

// Super Admin CV and approval management
router.get(
  "/cv-details/:id",
  protect,
  authorize("Super Admin"),
  getCVDetails
);

router.get(
  "/pending-requests",
  protect,
  authorize("Super Admin"),
  pendingRequests
);

router.put(
  "/approve/:id",
  protect,
  authorize("Super Admin"),
  approveProjectAdmin
);

router.put(
  "/reject/:id",
  protect,
  authorize("Super Admin"),
  rejectProjectAdmin
);

// Project Manager access
router.get("/manager", protect, authorize("Project Manager"), (req, res) => {
  res.json({ message: "Project Manager Access" });
});

// Team Member access
router.get(
  "/team-member",
  protect,
  authorize("Team Member"),
  (req, res) => {
    res.json({ message: "Team Member Access" });
  }
);

// Password recovery
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;