const { getDashboardData } = require("../services/dashboardService");
const Project = require("../models/Project");
const Task = require("../models/Task");
const mongoose = require("mongoose");

// Project Admin dashboard handler
const dashboard = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const result = await getDashboardData(req.user.id, workspaceId);
    return res.status(result.status).json(result.dashboard);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
    });
  }
};

// Project Manager dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({ message: "Invalid Workspace ID structure" });
    }

    const objectWorkspaceId = new mongoose.Types.ObjectId(workspaceId);

    // Get projects for the selected workspace.
    const projectFilter = {
      workspace: objectWorkspaceId,
      ...(req.user.role === "Project Manager" ? { createdBy: req.user.id } : {}),
    };

    const projects = await Project.find(projectFilter).sort({ createdAt: -1 });
    const totalProjects = projects.length;

    // Get tasks for these projects
    const projectIds = projects.map((p) => p._id);
    const tasks = await Task.find({ project: { $in: projectIds } });
    const totalTasks = tasks.length;

    // Count tasks by status
    const todoCount = tasks.filter((t) => t.status === "Todo" || t.status === "To Do").length;
    const progressCount = tasks.filter((t) => t.status === "In Progress").length;
    const doneCount = tasks.filter((t) => t.status === "Completed").length;

    // Count tasks by priority
    const priorityData = [
      { name: "High Priority", value: tasks.filter((t) => t.priority === "High").length },
      { name: "Medium Priority", value: tasks.filter((t) => t.priority === "Medium").length },
      { name: "Low Priority", value: tasks.filter((t) => t.priority === "Low").length },
    ];

    // Optimize DB calls by fetching task counts for all projects at once
    const taskCountsByProject = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      {
        $group: {
          _id: "$project",
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          todo: { $sum: { $cond: [{ $in: ["$status", ["Todo", "To Do"]] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } }
        }
      }
    ]);

    const countsMap = new Map(taskCountsByProject.map(c => [c._id.toString(), c]));

    // Calculate progress and task breakdown for each project
    const formattedProjectsProgress = projects.map((p) => {
      const pId = p._id.toString();
      const pCounts = countsMap.get(pId) || { total: 0, completed: 0, todo: 0, inProgress: 0 };

      const totalPTasks = pCounts.total;
      const completedPTasks = pCounts.completed;
      const todoPTasks = pCounts.todo;
      const inProgressPTasks = pCounts.inProgress;

      // Calculate project progress from project status
      const progressPercent =
        totalPTasks > 0
    ? Math.round((completedPTasks / totalPTasks) * 100)
    : 0;

      const projTitle = p.projectName || p.title || "Untitled Project";

      return {
        id: pId,
        title: projTitle,
        projectName: projTitle,
        status: p.status || "Planning",
        progress: progressPercent,
        todo: todoPTasks,
        inProgress: inProgressPTasks,
        completed: completedPTasks,
        startDate: p.startDate,
        endDate: p.endDate,
        deadline: p.endDate,
      };
    });

    // Get task activity for the last 7 days
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const trendData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));

      const dayTasks = tasks.filter((t) => t.createdAt >= startOfDay && t.createdAt <= endOfDay);

      trendData.push({
        day: dayName,
        todo: dayTasks.filter((t) => t.status === "Todo" || t.status === "To Do").length,
        inProgress: dayTasks.filter((t) => t.status === "In Progress").length,
        completed: dayTasks.filter((t) => t.status === "Completed").length,
      });
    }

    return res.status(200).json({
      totalProjects,
      totalTasks,
      todoCount,
      progressCount,
      doneCount,
      priorityData,
      projectsProgress: formattedProjectsProgress,
      trendData,
      recentProjects: formattedProjectsProgress.slice(0, 5),
    });
  } catch (error) {
    console.error("Dashboard Aggregation Controller Error:", error);
    return res.status(500).json({
      message: "Server Error loading dashboard stats",
    });
  }
};

module.exports = { dashboard, getDashboardStats, };
