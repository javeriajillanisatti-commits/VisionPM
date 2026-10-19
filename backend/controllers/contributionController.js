const Task = require("../models/Task");
const Comment = require("../models/Comment");
const User = require("../models/User");

// Get member contribution
exports.getMyContribution = async (req, res) => {
  try {
    const { projectId } = req.params;

    const member = await User.findById(req.user.id).select("fullName profilePic");
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }

   const tasks = await Task.find({
  project: projectId,
  assignedTo: req.user.id,
})
  .select("taskTitle title description status priority deadline files assignedTo")
  .populate("assignedTo", "fullName profilePic");

const tasksWithCounts = await Promise.all(
  tasks.map(async (task) => ({
    _id: task._id,
    taskTitle: task.taskTitle || task.title,
    description: task.description || "",
    status: task.status,
    priority: task.priority,
    deadline: task.deadline,
    assignees: (task.assignedTo || []).map((member) => ({
      _id: member._id,
      fullName: member.fullName,
      profilePic: member.profilePic || null,
    })),
    filesCount: task.files?.length || 0,
    commentsCount: await Comment.countDocuments({ task: task._id }),
  }))
);

    const summary = tasksWithCounts.reduce(
      (acc, task) => ({
        totalTasks: acc.totalTasks + 1,
        totalFiles: acc.totalFiles + task.filesCount,
        totalComments: acc.totalComments + task.commentsCount,
      }),
      { totalTasks: 0, totalFiles: 0, totalComments: 0 }
    );

    return res.status(200).json({
      success: true,
      profile: {
        fullName: member.fullName,
        profilePic: member.profilePic || null,
      },
      tasks: tasksWithCounts,
      summary,
    });
  } catch (error) {
    console.error("getMyContribution error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};