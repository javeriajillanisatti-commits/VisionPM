const express = require("express");
const router = express.Router();
const { getMyWorkPlan, createWorkPlan, updateWorkPlan, deleteWorkPlan } = require("../controllers/workPlanController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, authorize("team-member"), getMyWorkPlan);
router.post("/", protect, authorize("team-member"), createWorkPlan);
router.put("/:id", protect, authorize("team-member"), updateWorkPlan);
router.delete("/:id", protect, authorize("team-member"), deleteWorkPlan);

module.exports = router;   