const mongoose = require("mongoose");
const Workspace = require("../models/Workspace");
const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Invite = require("../models/invite");
const { calculateWorkloadForMember } = require("../utils/workloadCalculator");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getWorkspace = async (workspaceId, userId, role) => {
  if (!isValidId(workspaceId)) return null;

  if (role === "Project Admin")
    return Workspace.findOne({ _id: workspaceId, projectAdmin: userId });

  const user = await User.findOne({
    _id: userId,
    workspace: workspaceId,
  }).select("_id");

  return user ? Workspace.findById(workspaceId) : null;
};

const projectFilter = (workspaceId, role, userId) => ({
  workspace: workspaceId,
  ...(role === "Project Manager" && { createdBy: userId }),
});

const formatAssignee = (assignedTo) =>
  Array.isArray(assignedTo)
    ? assignedTo.map((u) => u.fullName || u.name || "Unknown").join(", ")
    : assignedTo?.fullName || assignedTo?.name || "Unassigned";

const workloadFromSize = { XS: 5, S: 10, M: 20, L: 40, XL: 80 };

const formatTask = (task, map = false) => {
  const name = task.taskTitle || task.title || "Untitled Task";
  const status = task.status === "Todo" ? "To Do" : task.status || "Todo";
  const dueDate = task.deadline
    ? task.deadline.toISOString().substring(0, 10)
    : "N/A";

  return map
    ? {
        id: task._id.toString(),
        title: name,
        priority: task.priority || "Medium",
        status,
        progress: typeof task.progress === "number" ? task.progress : 0,
        assignee: formatAssignee(task.assignedTo),
        dueDate,
      }
    : {
        taskId: task._id.toString(),
        name,
        status,
        priority: task.priority || "Medium",
        workload: workloadFromSize[task.size] || 0,
        progress: task.progress || 0,
        time_left: task.deadline
          ? Math.max(
              0,
              Math.ceil((new Date(task.deadline) - Date.now()) / 86400000)
            )
          : 0,
        dueDate,
        deadline: task.deadline,
        assignedTo: formatAssignee(task.assignedTo),
      };
};

// Create workspace
const createWorkspace = async (workspaceData, projectAdminId) => {
  const { name, description } = workspaceData;

  if (await Workspace.findOne({ name }))
    return { status: 400, message: "Workspace already exists" };

  const workspace = await Workspace.create({
    name,
    description,
    projectAdmin: projectAdminId,
  });

  return {
    status: 201,
    message: "Workspace created successfully",
    workspace,
  };
};

// Get all workspaces
const getAllWorkspaces = async (userId, userRole, workspaceId) => {
  workspaceId = workspaceId === "null" ? null : workspaceId;
  let workspaces = [];

  if (userRole === "Project Admin") {
    const filter = { projectAdmin: userId };
    if (workspaceId) filter._id = workspaceId;

    workspaces = await Workspace.find(filter)
      .populate("projectAdmin", "fullName email")
      .sort({ createdAt: -1 });
  } else {
    const user = await User.findById(userId);

    if (user?.workspace) {
      const workspace = await Workspace.findById(user.workspace).populate(
        "projectAdmin",
        "fullName email"
      );
      if (workspace) workspaces = [workspace];
    }
  }

  const result = await Promise.all(
    workspaces.map(async (workspace) => ({
      ...workspace.toObject(),
      projectsCount: await Project.countDocuments(
        projectFilter(workspace._id, userRole, userId)
      ),
    }))
  );

  return { status: 200, workspaces: result };
};

// Get workspace by ID
const getWorkspaceById = async (workspaceId, userId, userRole) => {
  const workspace = await getWorkspace(workspaceId, userId, userRole);

  if (!workspace)
    return {
      status: 404,
      message: "Workspace not found or unauthorized access block.",
    };

  return {
    status: 200,
    workspace: {
      ...workspace.toObject(),
      projectsCount: await Project.countDocuments(
        projectFilter(workspace._id, userRole, userId)
      ),
    },
  };
};

// Update workspace
const updateWorkspace = async (workspaceId, workspaceData, projectAdminId) => {
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    projectAdmin: projectAdminId,
  });

  if (!workspace) return { status: 404, message: "Workspace not found" };

  workspace.name = workspaceData.name || workspace.name;
  workspace.description =
    workspaceData.description || workspace.description;

  await workspace.save();

  return {
    status: 200,
    message: "Workspace updated successfully",
    workspace,
  };
};

// Delete workspace
const deleteWorkspace = async (workspaceId, projectAdminId) => {
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    projectAdmin: projectAdminId,
  });

  if (!workspace) return { status: 404, message: "Workspace not found" };

  const count = await Project.countDocuments({ workspace: workspaceId });

  if (count)
    return {
      status: 400,
      message: `Cannot delete workspace. It contains ${count} active project(s). Please delete all projects first.`,
    };

  await Workspace.findByIdAndDelete(workspaceId);
  return { status: 200, message: "Workspace deleted successfully" };
};

// Get workspace project monitoring data
const getWorkspaceMonitorData = async (workspaceId, userId, userRole) => {
  if (!isValidId(workspaceId))
    return { status: 400, monitorData: [] };

  if (
    userRole === "Project Admin" &&
    !(await getWorkspace(workspaceId, userId, userRole))
  )
    return {
      status: 403,
      monitorData: [],
      message: "Unauthorized workspace access",
    };

  if (userRole === "Project Manager") {
    const manager = await User.findOne({
      _id: userId,
      role: "Project Manager",
      workspace: workspaceId,
    }).select("_id");

    if (!manager)
      return {
        status: 403,
        monitorData: [],
        message: "Unauthorized workspace access",
      };
  }

  const projects = await Project.find(
    projectFilter(workspaceId, userRole, userId)
  ).sort({ createdAt: -1 });

  const monitorData = await Promise.all(
    projects.map(async (project) => {
      const tasks = await Task.find({ project: project._id })
        .populate("assignedTo", "fullName email role")
        .sort({ createdAt: 1 });

      const total = tasks.length;
      const completed = tasks.filter(
        (task) => task.status === "Completed"
      ).length;
      const todo = tasks.filter((task) =>
        ["todo", "to do"].includes(task.status?.trim().toLowerCase())
      ).length;
      const inProgress = tasks.filter((task) =>
        ["in progress", "inprogress"].includes(
          task.status?.trim().toLowerCase()
        )
      ).length;

      return {
        id: project._id.toString(),
        name: project.projectName || project.title || "Untitled Project",
        status: project.status || "Planning",
        startDate: project.startDate,
        endDate: project.endDate,
        total,
        todo,
        inProgress,
        completed,
        // completed = 100%, in progress = 50%, todo = 0%
        progress: total
          ? Math.round((inProgress * 50 + completed * 100) / total)
          : 0,
        tasks: tasks.map((task) => formatTask(task)),
      };
    })
  );

  return { status: 200, monitorData };
};

// Get workspace members with projects
const getWorkspaceMembersWithProjects = async (
  workspaceId,
  userId = null,
  userRole = null
) => {
  if (!isValidId(workspaceId))
    return { status: 400, membersData: [] };

  if (
    userRole === "Project Manager" &&
    !(await getWorkspace(workspaceId, userId, userRole))
  )
    return {
      status: 403,
      membersData: [],
      message: "Unauthorized workspace access",
    };

  const projects = await Project.find(
    projectFilter(workspaceId, userRole, userId)
  ).select("_id");

  const projectIds = projects.map((project) => project._id);

  // PM Members page must show only Team Members invited by the current PM.
  // Workspace membership alone is not enough because multiple PMs can share
  // the same workspace while maintaining separate teams.
  const invitedEmails = await Invite.find({
    workspace: workspaceId,
    invitedBy: userId,
    role: "Team Member",
    status: "accepted",
  }).distinct("email");

  const users = await User.find({
    workspace: workspaceId,
    role: "Team Member",
    email: { $in: invitedEmails },
  })
    .select("fullName email role profilePic createdAt")
    .sort({ fullName: 1 });

  const membersData = await Promise.all(
    users.map(async (user) => {
      const tasks = await Task.find({
        assignedTo: user._id,
        project: { $in: projectIds },
      })
        .populate("project", "projectName description status")
        .select("project");

      const projectsMap = {};
      tasks.forEach((task) => {
        if (task.project)
          projectsMap[task.project._id.toString()] = task.project;
      });

      const workload = await calculateWorkloadForMember(user._id);

      return {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic || null,
        projects: Object.values(projectsMap),
        workload: workload.workload,
        availability: workload.availability,
        joinedDate: user.createdAt,
      };
    })
  );

  return { status: 200, membersData };
};

// Build workspace project map
const getWorkspaceProjectMap = async (workspaceId, userId, userRole) => {
  if (!isValidId(workspaceId))
    return { status: 400, message: "Invalid Workspace ID" };

  const workspace = await getWorkspace(workspaceId, userId, userRole);

  if (!workspace)
    return { status: 403, message: "Unauthorized workspace access" };

  const projects = await Project.find(
    projectFilter(workspaceId, userRole, userId)
  ).sort({ createdAt: -1 });

  const projectMap = await Promise.all(
    projects.map(async (project) => {
      const tasks = await Task.find({ project: project._id })
        .populate("assignedTo", "fullName email role profilePic")
        .sort({ createdAt: 1 });

      const formattedTasks = tasks.map((task) => formatTask(task, true));
      const completed = formattedTasks.filter(
        (task) => task.status.toLowerCase() === "completed"
      ).length;
      const inProgressCount = formattedTasks.filter((task) =>
        ["in progress", "inprogress"].includes(task.status.toLowerCase())
      ).length;

      return {
        id: project._id.toString(),
        name: project.projectName || project.title || "Untitled Project",
        description: project.description || "",
        status: project.status || "Planning",
        progress: formattedTasks.length
          ? Math.round(
              (inProgressCount * 50 + completed * 100) / formattedTasks.length
            )
          : 0,
        totalTasks: formattedTasks.length,
        tasks: formattedTasks,
      };
    })
  );

  return {
    status: 200,
    mapData: {
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
        description: workspace.description || "",
      },
      projects: projectMap,
      totalProjects: projectMap.length,
      totalTasks: projectMap.reduce(
        (sum, project) => sum + project.totalTasks,
        0
      ),
    },
  };
};

// Scan project health
const getProjectHealth = async (workspaceId, userId, userRole) => {
  if (!isValidId(workspaceId))
    return { status: 400, message: "Invalid Workspace ID" };

  const workspace = await getWorkspace(workspaceId, userId, userRole);

  if (!workspace)
    return { status: 403, message: "Unauthorized workspace access" };

  const projects = await Project.find(
    projectFilter(workspaceId, userRole, userId)
  ).sort({ createdAt: -1 });

  const healthData = await Promise.all(
    projects.map(async (project) => {
      const tasks = await Task.find({ project: project._id });
      const totalTasks = tasks.length;

      const completedTasks = tasks.filter(
        (task) => task.status?.trim().toLowerCase() === "completed"
      ).length;

      const inProgressTasks = tasks.filter((task) =>
        ["in progress", "inprogress"].includes(
          task.status?.trim().toLowerCase()
        )
      ).length;

      const overdueTasks = tasks.filter(
        (task) =>
          task.deadline &&
          task.status?.trim().toLowerCase() !== "completed" &&
          new Date(task.deadline) < new Date()
      ).length;

      const highPriorityTasks = tasks.filter(
        (task) => task.priority?.trim().toLowerCase() === "high"
      ).length;

      const unassignedTasks = tasks.filter(
        (task) => !task.assignedTo || !task.assignedTo.length
      ).length;

      const progress = totalTasks
        ? Math.round((inProgressTasks * 50 + completedTasks * 100) / totalTasks)
        : 0;

      let score = 100;
      if (!totalTasks) score -= 25;
      score -= Math.min(overdueTasks * 10, 40);
      score -= Math.min(highPriorityTasks * 5, 20);
      score -= Math.min(unassignedTasks * 5, 20);
      if (totalTasks && progress < 30) score -= 10;

      score = Math.max(0, score);

      return {
        projectId: project._id.toString(),
        projectName:
          project.projectName || project.title || "Untitled Project",
        projectStatus: project.status || "Planning",
        health: score < 50 ? "Critical" : score < 75 ? "At Risk" : "Healthy",
        score,
        progress,
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        highPriorityTasks,
        unassignedTasks,
      };
    })
  );

  const totalProjects = healthData.length;
  const healthyProjects = healthData.filter(
    (project) => project.health === "Healthy"
  ).length;
  const atRiskProjects = healthData.filter(
    (project) => project.health === "At Risk"
  ).length;
  const criticalProjects = healthData.filter(
    (project) => project.health === "Critical"
  ).length;

  const overallScore = totalProjects
    ? Math.round(
        healthData.reduce((sum, project) => sum + project.score, 0) /
          totalProjects
      )
    : 0;

  return {
    status: 200,
    healthData: {
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
      },
      overallHealth:
        overallScore < 50
          ? "Critical"
          : overallScore < 75
          ? "At Risk"
          : "Healthy",
      overallScore,
      totalProjects,
      healthyProjects,
      atRiskProjects,
      criticalProjects,
      projects: healthData,
    },
  };
};

module.exports = {
  createWorkspace,
  getAllWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMonitorData,
  getWorkspaceMembersWithProjects,
  getWorkspaceProjectMap,
  getProjectHealth,
};