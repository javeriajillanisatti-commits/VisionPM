const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const Workspace = require("../models/Workspace");

const isAdminWorkspace = async (workspaceId, userId) => {
  if (!workspaceId || !userId) return false;

  return !!(await Workspace.findOne({
    _id: workspaceId,
    projectAdmin: userId,
  }).select("_id"));
};

const calculateProgress = (status, tasksCount, completedTasks) => {
  // Project progress is driven by actual task completion. The project status
  // may become Completed automatically when every task is completed, but an
  // In Progress status must never force the progress to 50%.
  return tasksCount > 0
    ? Math.round((completedTasks / tasksCount) * 100)
    : 0;
};

const syncProjectCompletionStatus = async project => {
  const tasks = await Task.find({ project: project._id }).select("status");

  if (!tasks.length) {
    if (project.status === "Completed") {
      project.status = "In Progress";
      await project.save();
    }
    return;
  }

  const hasInProgressTask = tasks.some(task => task.status === "In Progress");
  const allCompleted = tasks.every(task => task.status === "Completed");

  // Task activity has priority: any In Progress task makes the project In Progress.
  if (hasInProgressTask && project.status !== "In Progress") {
    project.status = "In Progress";
    await project.save();
    return;
  }

  // A project becomes Completed only when every project task is Completed.
  if (allCompleted && project.status !== "Completed") {
    project.status = "Completed";
    await project.save();
  } else if (!allCompleted && project.status === "Completed") {
    project.status = "In Progress";
    await project.save();
  }
};

const createProject = async (projectData, userId, userRole) => {
  try {
    const {
      projectName,
      description,
      workspace,
      workspaceId,
      status,
      startDate,
      endDate,
    } = projectData;

    const selectedWorkspace = workspace || workspaceId;

    if (!selectedWorkspace) {
      return { status: 400, message: "Workspace is required" };
    }

    if (
      userRole === "Project Admin" &&
      !(await isAdminWorkspace(selectedWorkspace, userId))
    ) {
      return {
        status: 403,
        message:
          "You are not authorized to create a project in this workspace",
      };
    }

    const existingProject = await Project.findOne({
      workspace: selectedWorkspace,
      projectName: {
        $regex: new RegExp(`^${projectName.trim()}$`, "i"),
      },
    });

    if (existingProject) {
      return {
        status: 409,
        message: "Project name already exists. Choose a different name.",
      };
    }

    const project = new Project({
      projectName,
      description,
      workspace: selectedWorkspace,
      createdBy: userId,
      status: status || "Planning",
      startDate: startDate || new Date(),
      endDate: endDate || new Date(),
    });

    await project.save();

    return {
      status: 201,
      message: "Project created successfully",
      project,
    };
  } catch (error) {
    console.error("Create Project Service Error:", error);
    throw error;
  }
};

const getProjectsByWorkspace = async (workspaceId, userId, userRole) => {
  if (
    userRole === "Project Admin" &&
    !(await isAdminWorkspace(workspaceId, userId))
  ) {
    return {
      status: 200,
      projects: [],
      message: "No projects found for this workspace",
    };
  }

  let projectFilter = {
    workspace: workspaceId,
  };

  if (userRole === "Project Manager") {
    projectFilter.createdBy = userId;
  }

  const projects = await Project.find(projectFilter)
    .populate("createdBy", "fullName email")
    .populate("members", "fullName email profilePicture role")
    .sort({ createdAt: -1 });

  const dynamicProjects = await Promise.all(
    projects.map(async (proj) => {
      await syncProjectCompletionStatus(proj);
      const projObj = proj.toObject ? proj.toObject() : proj;
      const tasksCount = await Task.countDocuments({ project: proj._id });
      const completedTasks = await Task.countDocuments({
        project: proj._id,
        status: "Completed",
      });

      return {
        ...projObj,
        tasksCount,
        completedTasks,
        progress: calculateProgress(
          proj.status,
          tasksCount,
          completedTasks
        ),
      };
    })
  );

  return { status: 200, projects: dynamicProjects };
};

const getDashboardProjects = async (
  workspaceId = null,
  userId = null,
  userRole = null
) => {
  let filter = {};

  if (userRole === "Project Admin") {
    const adminWorkspaces = await Workspace.find({
      projectAdmin: userId,
    }).select("_id");

    const adminWorkspaceIds = adminWorkspaces.map(
      (ws) => ws._id
    );

    if (workspaceId) {
      const allowed = adminWorkspaceIds.some(
        (id) => id.toString() === workspaceId.toString()
      );

      if (!allowed) return { status: 200, projects: [] };

      filter.workspace = workspaceId;
    } else {
      filter.workspace = { $in: adminWorkspaceIds };
    }
  } else if (userRole === "Project Manager") {
    filter.workspace = workspaceId;
    filter.createdBy = userId;
  } else if (workspaceId) {
    filter.workspace = workspaceId;
  }

  const projects = await Project.find(filter)
    .populate("workspace", "name")
    .populate("createdBy", "fullName email")
    .populate("members", "fullName email profilePicture role")
    .sort({ createdAt: -1 });

  const dynamicDashboardProjects = await Promise.all(
    projects.map(async (proj) => {
      await syncProjectCompletionStatus(proj);
      const projObj = proj.toObject ? proj.toObject() : proj;
      const tasksCount = await Task.countDocuments({
        project: proj._id,
      });
      const completedTasks = await Task.countDocuments({
        project: proj._id,
        status: "Completed",
      });

      return {
        ...projObj,
        tasksCount,
        completedTasks,
        progress: calculateProgress(
          proj.status,
          tasksCount,
          completedTasks
        ),
      };
    })
  );

  return {
    status: 200,
    projects: dynamicDashboardProjects,
  };
};

const getProjectById = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId)
    .populate("workspace", "name")
    .populate("createdBy", "fullName email")
    .populate("members", "fullName email profilePicture role");

  if (!project) {
    return { status: 404, message: "Project not found" };
  }

  if (
    userRole === "Project Admin" &&
    !(await isAdminWorkspace(
      project.workspace?._id || project.workspace,
      userId
    ))
  ) {
    return {
      status: 403,
      message: "You are not authorized to access this project",
    };
  }

  await syncProjectCompletionStatus(project);
  const projectObj = project.toObject ? project.toObject() : project;

  projectObj.tasksCount = await Task.countDocuments({
    project: project._id,
  });

  projectObj.completedTasks = await Task.countDocuments({
    project: project._id,
    status: "Completed",
  });

  projectObj.progress = calculateProgress(
    projectObj.status,
    projectObj.tasksCount,
    projectObj.completedTasks
  );

  return {
    status: 200,
    project: projectObj,
  };
};

const updateProject = async (
  projectId,
  updateData,
  userId,
  userRole
) => {
  const existingProject = await Project.findById(projectId);

  if (!existingProject) {
    return { status: 404, message: "Project not found" };
  }

  if (
    userRole === "Project Admin" &&
    !(await isAdminWorkspace(existingProject.workspace, userId))
  ) {
    return {
      status: 403,
      message: "You are not authorized to update this project",
    };
  }

  if (updateData.workspaceId && !updateData.workspace) {
    updateData.workspace = updateData.workspaceId;
  }

  if (
    updateData.workspace &&
    updateData.workspace.toString() !==
      existingProject.workspace.toString() &&
    userRole === "Project Admin" &&
    !(await isAdminWorkspace(updateData.workspace, userId))
  ) {
    return {
      status: 403,
      message:
        "You are not authorized to move this project to this workspace",
    };
  }

  if (updateData.projectName) {
    const workspaceForCheck =
      updateData.workspace || existingProject.workspace;

    const duplicateProject = await Project.findOne({
      _id: { $ne: projectId },
      workspace: workspaceForCheck,
      projectName: {
        $regex: new RegExp(
          `^${updateData.projectName.trim()}$`,
          "i"
        ),
      },
    });

    if (duplicateProject) {
      return {
        status: 409,
        message: "Project name already exists. Choose a different name.",
      };
    }
  }

  if (Object.prototype.hasOwnProperty.call(updateData, "status")) {
    const manualStatusChangeAllowed = ["On Hold", "Cancelled"];
    const isCurrentStatus = updateData.status === existingProject.status;

    if (!isCurrentStatus && !manualStatusChangeAllowed.includes(updateData.status)) {
      return {
        status: 400,
        field: "status",
        message:
          "Project status can only be changed manually to On Hold or Cancelled. In Progress and Completed are updated automatically based on task status.",
      };
    }

    // A project cannot be manually put On Hold/Cancelled while any task is
    // already In Progress. Task activity has priority over manual status.
    if (manualStatusChangeAllowed.includes(updateData.status)) {
      const hasInProgressTask = await Task.exists({
        project: projectId,
        status: "In Progress",
      });

      if (hasInProgressTask) {
        return {
          status: 400,
          field: "status",
          message:
            "Project cannot be put On Hold or Cancelled while a task is In Progress.",
        };
      }
    }
  }

  if (updateData.status === "Completed") {
    const taskCount = await Task.countDocuments({ project: projectId });
    const completedCount = await Task.countDocuments({
      project: projectId,
      status: "Completed",
    });

    if (taskCount === 0 || completedCount !== taskCount) {
      return {
        status: 400,
        field: "status",
        message: "Project can only be marked Completed after all project tasks are completed.",
      };
    }
  }

  const project = await Project.findByIdAndUpdate(
    projectId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("workspace", "name")
    .populate("createdBy", "fullName email")
    .populate("members", "fullName email profilePicture role");

  await syncProjectCompletionStatus(project);

  return {
    status: 200,
    message: "Project updated successfully",
    project,
  };
};

const deleteProject = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId);

  if (!project) {
    return { status: 404, message: "Project not found" };
  }

  if (
    userRole === "Project Admin" &&
    !(await isAdminWorkspace(project.workspace, userId))
  ) {
    return {
      status: 403,
      message: "You are not authorized to delete this project",
    };
  }

  const taskDeleteResult = await Task.deleteMany({
    project: projectId,
  });

  const deletedProject = await Project.findByIdAndDelete(projectId);

  if (!deletedProject) {
    return {
      status: 404,
      message: "Project could not be deleted",
    };
  }

  return {
    status: 200,
    message: "Project deleted successfully",
    deletedTasks: taskDeleteResult.deletedCount,
  };
};

const getWorkspaceMembers = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId);

  if (!project) {
    return { status: 404, message: "Project not found" };
  }

  if (
    userRole === "Project Admin" &&
    !(await isAdminWorkspace(project.workspace, userId))
  ) {
    return {
      status: 403,
      message: "You are not authorized to access this project's members",
    };
  }

  const members = await User.find({
    workspace: project.workspace,
    role: "Team Member",
  }).select("_id fullName email role profilePicture");

  const projectManagers = await User.find({
    workspace: project.workspace,
    role: "Project Manager",
  }).select("_id fullName email role profilePicture");

  const memberIds = members.map((member) => member._id);

  const taskCounts = memberIds.length
    ? await Task.aggregate([
        {
          $match: {
            project: project._id,
            assignedTo: { $in: memberIds },
          },
        },
        { $unwind: "$assignedTo" },
        {
          $match: {
            assignedTo: { $in: memberIds },
          },
        },
        {
          $group: {
            _id: "$assignedTo",
            assignedTaskCount: { $sum: 1 },
          },
        },
      ])
    : [];

  const taskCountMap = new Map(
    taskCounts.map((item) => [
      item._id.toString(),
      item.assignedTaskCount,
    ])
  );

  const membersWithTaskCounts = members.map((member) => ({
    ...(member.toObject ? member.toObject() : member),
    assignedTaskCount:
      taskCountMap.get(member._id.toString()) || 0,
  }));

  return {
    status: 200,
    members: membersWithTaskCounts,
    projectManagers,
    selectedMembers: project.members || [],
  };
};

const updateProjectMembers = async (
  projectId,
  members,
  userId,
  userRole
) => {
  const project = await Project.findById(projectId);

  if (!project) {
    return { status: 404, message: "Project not found" };
  }

  if (
    userRole === "Project Admin" &&
    !(await isAdminWorkspace(project.workspace, userId))
  ) {
    return {
      status: 403,
      message: "You are not authorized to update project members",
    };
  }

  const mongoose = require("mongoose");

  const requestedMemberIds = Array.isArray(members)
    ? members
        .map((id) => id?.toString().trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id))
    : [];

  const currentMemberIds = (project.members || [])
    .map((id) => id?.toString())
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const requestedIdSet = new Set(
    requestedMemberIds.map((id) => id.toString())
  );

  const removedMemberIds = currentMemberIds.filter(
    (id) => !requestedIdSet.has(id.toString())
  );

  if (removedMemberIds.length) {
    const blockedMembers = [];

    for (const memberId of removedMemberIds) {
      const assignedTaskCount = await Task.countDocuments({
        project: project._id,
        assignedTo: memberId,
      });

      if (assignedTaskCount > 0) {
        const member = await User.findById(memberId)
          .select("_id fullName")
          .lean();

        blockedMembers.push({
          memberId: memberId.toString(),
          fullName: member?.fullName || "Project member",
          assignedTaskCount,
        });
      }
    }

    if (blockedMembers.length) {
      return {
        status: 409,
        message:
          "These project members cannot be removed because they still have assigned tasks. Reassign their tasks first.",
        blockedMembers,
      };
    }
  }

  project.members = requestedMemberIds;
  await project.save();

  return {
    status: 200,
    message: "Project members updated successfully",
    members: project.members,
  };
};

const getProjectMembers = async (
  projectId,
  userId,
  userRole
) => {
  const project = await Project.findById(projectId).populate(
    "members",
    "_id fullName email role profilePicture"
  );

  if (!project) {
    return { status: 404, message: "Project not found" };
  }

  if (
    userRole === "Project Admin" &&
    !(await isAdminWorkspace(project.workspace, userId))
  ) {
    return {
      status: 403,
      message: "You are not authorized to access project members",
    };
  }

  return {
    status: 200,
    members: project.members,
  };
};

module.exports = {
  createProject,
  getProjectsByWorkspace,
  getDashboardProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getWorkspaceMembers,
  updateProjectMembers,
  getProjectMembers,
};