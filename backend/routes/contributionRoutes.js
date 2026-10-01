const express = require("express");
const router = express.Router();
const { getMyContribution } = require("../controllers/contributionController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/:projectId", protect, authorize("team-member"), getMyContribution);

module.exports = router;