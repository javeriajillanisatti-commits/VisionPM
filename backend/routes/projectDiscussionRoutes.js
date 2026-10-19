const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getProjectDiscussion } = require("../controllers/projectDiscussionController");

const router = express.Router();

router.get("/:projectId", protect, getProjectDiscussion);

module.exports = router;
