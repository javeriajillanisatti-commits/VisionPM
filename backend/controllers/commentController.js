const Comment = require("../models/Comment");
const Task = require("../models/Task");
const Project = require("../models/Project");

const cleanRole = (role) =>
  role?.toString().toLowerCase().replace(/[\s_-]+/g, "") || "";

const getTaskCommentAccess = async (taskId, userId, userRole) => {
  const task = await Task.findById(taskId).select("project createdBy assignedTo");
  if (!task) return { task: null, project: null, allowed: false, isPM: false };

  const project = await Project.findById(task.project).select("createdBy members");
  if (!project) return { task, project: null, allowed: false, isPM: false };

  const userIdString = String(userId);
  const isPM =
    cleanRole(userRole) === "projectmanager" &&
    String(project.createdBy || "") === userIdString;
  const isAssignedTM = (task.assignedTo || []).some(
    (id) => String(id) === userIdString
  );

  return {
    task,
    project,
    allowed: isPM || isAssignedTM,
    isPM,
    isAssignedTM,
  };
};

// Get task comments
const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id || req.user._id;
    const access = await getTaskCommentAccess(taskId, userId, req.user.role);

    if (!access.task) {
      return res.status(404).json({ status: 404, message: "Task not found." });
    }

    if (!access.allowed) {
      return res.status(403).json({
        status: 403,
        message:
          "Access denied. Only the Project Manager and assigned Team Members can view task comments.",
      });
    }

    const comments = await Comment.find({
      task: taskId,
      hiddenFor: { $nin: [userId] },
    })
      .populate("sender", "fullName email role profilePic")
      .sort({ createdAt: 1 });

    return res.status(200).json({ status: 200, comments });
  } catch (error) {
    console.error("Get Comments Controller Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { getTaskComments, getTaskCommentAccess };