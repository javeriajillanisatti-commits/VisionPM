const express = require("express");
const {
  getUsers,
  getUserQuickView,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getUsers);
router.get("/:userId/quick-view", protect, getUserQuickView);

module.exports = router;