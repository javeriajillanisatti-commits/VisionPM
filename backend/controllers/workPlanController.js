const WorkPlan = require("../models/WorkPlan");

// Convert HH:MM to minutes
const toMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Get logged-in member's work plans
exports.getMyWorkPlan = async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { teamMember: req.user.id };
    if (date) filter.date = date;

    const plans = await WorkPlan.find(filter)
      .populate("task", "taskTitle title priority status deadline")
      .sort({ startTime: 1 });

    return res.status(200).json({ success: true, plans });
  } catch (error) {
    console.error("getMyWorkPlan error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
      error: error.stack,
    });
  }
};

// Update existing work plan
exports.updateWorkPlan = async (req, res) => {
  try {
    const { startTime, endTime, note } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);
    if (newStart >= newEnd) {
      return res.status(400).json({
        success: false,
        message: "Start time must be before end time",
      });
    }

    const plan = await WorkPlan.findOne({
      _id: req.params.id,
      teamMember: req.user.id,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Schedule entry not found",
      });
    }

    const existingPlans = await WorkPlan.find({
      teamMember: req.user.id,
      date: plan.date,
      _id: { $ne: plan._id },
    });

    const hasConflict = existingPlans.some((item) => {
      const start = toMinutes(item.startTime);
      const end = toMinutes(item.endTime);
      return newStart < end && newEnd > start;
    });

    if (hasConflict && req.query.force !== "true") {
      return res.status(409).json({
        success: false,
        conflict: true,
        message: "This slot overlaps with an existing schedule",
      });
    }

    plan.startTime = startTime;
    plan.endTime = endTime;
    if (note !== undefined) plan.note = note;
    await plan.save();

    const populated = await plan.populate(
      "task",
      "taskTitle title priority status deadline"
    );

    return res.status(200).json({ success: true, plan: populated });
  } catch (error) {
    console.error("updateWorkPlan error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create new work plan
exports.createWorkPlan = async (req, res) => {
  try {
    const { task, date, startTime, endTime, note } = req.body;

    if (!task || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "User authentication information is missing",
      });
    }

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);

    if (newStart >= newEnd) {
      return res.status(400).json({
        success: false,
        message: "Start time must be before end time",
      });
    }

    const existingPlans = await WorkPlan.find({
      teamMember: req.user.id,
      date,
    });

    const hasConflict = existingPlans.some((plan) => {
      const start = toMinutes(plan.startTime);
      const end = toMinutes(plan.endTime);
      return newStart < end && newEnd > start;
    });

    if (hasConflict && req.query.force !== "true") {
      return res.status(409).json({
        success: false,
        conflict: true,
        message: "This slot overlaps with an existing schedule",
      });
    }

    const newPlan = await WorkPlan.create({
      teamMember: req.user.id,
      task,
      date,
      startTime,
      endTime,
      note: note || "",
    });

    const populated = await WorkPlan.findById(newPlan._id).populate(
      "task",
      "taskTitle title priority status deadline"
    );

    return res.status(201).json({ success: true, plan: populated });
  } catch (error) {
    console.error("createWorkPlan error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
      error: error.stack,
    });
  }
};

// Delete work plan
exports.deleteWorkPlan = async (req, res) => {
  try {
    const plan = await WorkPlan.findOne({
      _id: req.params.id,
      teamMember: req.user.id,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Schedule entry not found",
      });
    }

    await plan.deleteOne();
    return res.status(200).json({
      success: true,
      message: "Removed from planner",
    });
  } catch (error) {
    console.error("deleteWorkPlan error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
      error: error.stack,
    });
  }
};