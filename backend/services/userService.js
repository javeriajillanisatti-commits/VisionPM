const User = require("../models/User");
const Workspace = require("../models/Workspace");
const Project = require("../models/Project");
const Task = require("../models/Task");
const AuditLog = require("../models/AuditLog");

const noUsers = () => ({
  status: 200,
  message: "No users found for this workspace",
  users: [],
});

// Get users with workspace isolation and search
const getUsers = async (query, loggedInUser) => {
  const { workspaceId, search } = query;
  const filter = {};

  if (loggedInUser?.role === "Project Admin") {
    const adminId = loggedInUser._id || loggedInUser.id;
    const workspaces = await Workspace.find({ projectAdmin: adminId }).select("_id");
    const ids = workspaces.map((ws) => ws._id);

    filter.role = { $in: ["Project Manager", "Team Member"] };

    if (workspaceId) {
      if (!ids.some((id) => String(id) === String(workspaceId)))
        return noUsers();

      filter.workspace = workspaceId;
    } else filter.workspace = { $in: ids };
  } else if (workspaceId) filter.workspace = workspaceId;

  if (search)
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];

  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 });

  return {
    status: 200,
    message: "Users fetched successfully",
    users,
  };
};

// Get user quick view
const getUserQuickView = async (userId, loggedInUser) => {
  const user = await User.findById(userId)
    .select("-password")
    .populate("workspace", "name");

  if (!user) return { status: 404, message: "User not found" };

  if (loggedInUser?.role === "Project Admin") {
    const adminId = loggedInUser._id || loggedInUser.id;
    const workspace = await Workspace.findOne({
      _id: user.workspace?._id || user.workspace,
      projectAdmin: adminId,
    }).select("_id");

    if (!workspace)
      return {
        status: 403,
        message: "You are not allowed to view this user",
      };
  }

  const userData = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profilePic: user.profilePic,
    isOnline: user.isOnline,
    createdAt: user.createdAt,
  };

  const workspaceId = user.workspace?._id || user.workspace;

  const recentActivity = await AuditLog.find({
  user: user._id,
})
  .sort({ createdAt: -1 })
  .select("action module description targetName createdAt");

  if (user.role === "Project Manager") {
    const projects = await Project.find({ createdBy: user._id })
      .select("projectName status createdAt members")
      .populate("members", "fullName email role profilePic");

    const projectIds = projects.map((project) => project._id);

    const stats = projectIds.length
      ? await Task.aggregate([
          { $match: { project: { $in: projectIds } } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              completed: {
                $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
              },
              pending: {
                $sum: { $cond: [{ $ne: ["$status", "Completed"] }, 1, 0] },
              },
            },
          },
        ])
      : [];

    const teamMap = new Map();

    projects.forEach((project) =>
      project.members?.forEach((member) => {
        if (member?._id) teamMap.set(String(member._id), member);
      })
    );

    return {
      status: 200,
      message: "User quick view fetched successfully",
      user: userData,
      type: "manager",
      data: {
        projects: { total: projects.length, items: projects },
        tasks: {
          total: stats[0]?.total || 0,
          completed: stats[0]?.completed || 0,
          pending: stats[0]?.pending || 0,
        },
        team: {
          total: teamMap.size,
          members: [...teamMap.values()],
        },
        recentActivity,
      },
    };
  }

  const assignedTasks = await Task.find({ assignedTo: user._id })
    .select("taskTitle status priority deadline project createdAt")
    .populate("project", "projectName");

  const completed = assignedTasks.filter(
    (task) => task.status === "Completed"
  ).length;

  return {
    status: 200,
    message: "User quick view fetched successfully",
    user: userData,
    type: "teamMember",
    data: {
      assignedTasks: {
        total: assignedTasks.length,
        items: assignedTasks,
      },
      completed,
      pending: assignedTasks.length - completed,
      recentActivity,
    },
  };
};

module.exports = {
  getUsers,
  getUserQuickView,
};