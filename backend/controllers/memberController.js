const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Comment = require("../models/Comment");

// Get member workspace
const getMyWorkspace = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "workspace",
      populate: {
        path: "projectAdmin",
        select: "fullName email",
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.workspace) {
      return res.status(404).json({
        success: false,
        message: "No workspace assigned",
      });
    }

    const workspace = user.workspace.toObject();
    const projectsCount = await Project.countDocuments({
      workspace: workspace._id,
    });

    return res.status(200).json({
      success: true,
      workspace: { ...workspace, projectsCount },
    });
  } catch (error) {
    console.error("Get Workspace Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get member projects
const getMyProjects = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id });
    const projectIds = [
      ...new Set(tasks.map((task) => task.project.toString())),
    ];

    const projects = await Project.find({
      _id: { $in: projectIds },
    })
      .populate("workspace", "name")
      .populate("createdBy", "fullName");

    const projectsWithTaskCount = await Promise.all(
      projects.map(async (project) => {
        const projectObj = project.toObject();
        const projectTasks = await Task.find({
          project: projectObj._id,
        }).select("status");

        const completedTasks = projectTasks.filter(
          (task) => task.status === "Completed"
        ).length;

        return {
          ...projectObj,
          tasksCount: projectTasks.length,
          completedTasks,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: projectsWithTaskCount.length,
      projects: projectsWithTaskCount,
    });
  } catch (error) {
    console.error("Get Projects Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get member tasks
const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.user.id,
    })
      .populate("project", "projectName")
      .sort({ createdAt: -1 });

    const tasksWithCounts = await Promise.all(
      tasks.map(async (task) => ({
        ...task.toObject(),
        commentsCount: await Comment.countDocuments({ task: task._id }),
      }))
    );

    return res.status(200).json({
      success: true,
      count: tasksWithCounts.length,
      tasks: tasksWithCounts,
    });
  } catch (error) {
    console.error("Get My Tasks Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getMyWorkspace,
  getMyProjects,
  getMyTasks,
};