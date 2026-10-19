const express = require("express");
const router = express.Router();

const {
  sendInvite,
  verifyInvite,
} = require("../controllers/invitationController");

const { protect } = require("../middleware/authMiddleware");

// Send invite
router.post("/send", protect, sendInvite);

// Verify invite token
router.get("/verify/:token", verifyInvite);

module.exports = router;