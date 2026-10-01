const Task = require("../models/Task");
const Comment = require("../models/Comment");
const Project = require("../models/Project");
const Workspace = require("../models/Workspace");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const {
  detectTaskConflicts,
  ACTIVE_STATUSES,
} = require("../utils/taskConflictDetector");
const { SIZE_POINTS } = require("../utils/workloadCalculator");

const isProjectAdminWorkspaceAllowed = async (projectId, userId, role) => {
  const project = await Project.findById(projectId).select("workspace createdBy");
  if (!project) return false;

  if (role === "Project Admin")
    return !!(await Workspace.findOne({
      _id: project.workspace,
      projectAdmin: userId,
    }).select("_id"));

  if (role === "Project Manager")
    return String(project.createdBy) === String(userId);

  return true;
};

const isProjectManagerWorkspaceAllowed = async (workspaceId, userId) =>
  !!(
    workspaceId &&
    userId &&
    (await User.findOne({
      _id: userId,
      role: "Project Manager",
      workspace: workspaceId,
    }).select("_id"))
  );

const attachCommentsCount = async (tasks) =>
  Promise.all(
    tasks.map(async (task) => ({
      ...task.toObject(),
      commentsCount: await Comment.countDocuments({ task: task._id }),
    }))
  );

const getEmptyTasks = () => ({
  status: 200,
  message: "No tasks found for this workspace.",
  tasks: [],
});

const getEmptyInsights = () => ({
  status: 200,
  insights: [],
  summary: { totalTasks: 0, monitoredTasks: 0 },
});

const getProjectFilter = async (userId, role, workspaceId) => {
  if (role === "Project Admin") {
    const workspaces = await Workspace.find({ projectAdmin: userId }).select("_id");
    const ids = workspaces.map((item) => item._id);

    if (
      workspaceId &&
      !ids.some((id) => id.toString() === workspaceId.toString())
    )
      return null;

    return { workspace: workspaceId || { $in: ids } };
  }

  if (role === "Project Manager") {
    if (!(await isProjectManagerWorkspaceAllowed(workspaceId, userId)))
      return null;

    return { workspace: workspaceId, createdBy: userId };
  }

  return workspaceId ? { workspace: workspaceId } : {};
};

const getConflict = async (data, currentTaskId = null) =>
  detectTaskConflicts({
    assignees: data.assignees || [],
    priority: data.priority || "Medium",
    size: data.size || "M",
    deadline: data.deadline || null,
    assigneeWorkloads: data.assigneeWorkloads || [],
    ...(currentTaskId && { currentTaskId }),
  });

const canForceAssign = (role) =>
  ["project manager", "projectmanager", "project admin", "projectadmin"].includes(
    role?.toString().trim().toLowerCase()
  );

const normalizeId = (value) =>
  value?._id ? value._id.toString() : value?.toString();

const getTotalTaskWorkload = (size) => SIZE_POINTS[size] || 0;

const syncProjectCompletionStatus = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) return;

  const tasks = await Task.find({ project: projectId }).select("status");
  const allCompleted = tasks.length > 0 && tasks.every((task) => task.status === "Completed");

  if (allCompleted && project.status !== "Completed") {
    project.status = "Completed";
    await project.save();
  } else if (!allCompleted && project.status === "Completed") {
    project.status = "In Progress";
    await project.save();
  }
};

const buildEqualAllocations = (assigneeIds, totalPoints) => {
  if (!assigneeIds.length) return [];
  const each = totalPoints / assigneeIds.length;
  const allocations = assigneeIds.map((member) => ({
    member,
    workload: Number(each.toFixed(2)),
  }));

  // Keep the sum exactly equal to the task workload after rounding.
  const allocated = allocations.reduce((sum, item) => sum + item.workload, 0);
  const remainder = Number((totalPoints - allocated).toFixed(2));
  if (remainder !== 0) {
    allocations[allocations.length - 1].workload = Number(
      (allocations[allocations.length - 1].workload + remainder).toFixed(2)
    );
  }

  return allocations;
};

const validateAndBuildAllocations = ({
  assigneeIds,
  totalPoints,
  assigneeWorkloads,
  allocationMode,
}) => {
  if (assigneeIds.length === 0) return [];

  // One assignee keeps the original behaviour: the whole task effort belongs
  // to that member.
  if (assigneeIds.length === 1) {
    return [{ member: assigneeIds[0], workload: totalPoints }];
  }

  if (!["equal", "manual"].includes(allocationMode)) {
    return {
      error:
        "Multiple assignees require either Equal Split or Manual workload allocation.",
    };
  }

  if (allocationMode === "equal") {
    return buildEqualAllocations(assigneeIds, totalPoints);
  }

  if (!Array.isArray(assigneeWorkloads)) {
    return {
      error:
        "Please enter workload points for every selected assignee before saving.",
    };
  }

  const selectedSet = new Set(assigneeIds);
  const seen = new Set();
  const allocations = [];

  for (const item of assigneeWorkloads) {
    const member = normalizeId(item?.member);
    const workload = Number(item?.workload);

    if (!member || !selectedSet.has(member)) {
      return { error: "Workload allocation contains a non-assigned member." };
    }

    if (seen.has(member)) {
      return { error: "Each assignee can have only one workload allocation." };
    }

    if (!Number.isFinite(workload) || workload < 0) {
      return { error: "Workload points must be valid non-negative numbers." };
    }

    seen.add(member);
    allocations.push({ member, workload });
  }

  if (seen.size !== assigneeIds.length) {
    return {
      error:
        "Please enter workload points for every selected assignee before saving.",
    };
  }

  const allocatedTotal = allocations.reduce(
    (sum, item) => sum + item.workload,
    0
  );

  if (Math.abs(allocatedTotal - totalPoints) > 0.0001) {
    return {
      error: `Allocated workload must equal the task workload of ${totalPoints} points.`,
    };
  }

  return allocations;
};

const scaleAllocationsToTotal = (assigneeIds, previousAllocations, totalPoints) => {
  if (assigneeIds.length === 1) {
    return [{ member: assigneeIds[0], workload: totalPoints }];
  }

  const previousMap = new Map(
    (previousAllocations || []).map((item) => [
      normalizeId(item.member),
      Number(item.workload) || 0,
    ])
  );

  const kept = assigneeIds.map((member) => ({
    member,
    workload: previousMap.get(member) || 0,
  }));

  const previousTotal = kept.reduce((sum, item) => sum + item.workload, 0);

  if (previousTotal > 0) {
    return kept.map((item) => ({
      member: item.member,
      workload: Number(((item.workload / previousTotal) * totalPoints).toFixed(4)),
    }));
  }

  return buildEqualAllocations(assigneeIds, totalPoints);
};

const conflictResponse = (result) => ({
  status: 409,
  conflict: true,
  severity: result.severity || "Warning",
  workloadConflicts: result.workloadConflicts,
  taskConflicts: result.taskConflicts,
  message: [
    ...result.workloadConflicts.map((item) => `• Workload Conflict: ${item.message}`),
    ...result.taskConflicts.map(
      (item) => `• ${item.severity || "Warning"}: ${item.message}`
    ),
  ].join("\n\n"),
});

// Create task
const createTask = async (taskData, userId, userRole = null) => {
  const {
    taskTitle,
    description,
    deadline,
    priority,
    size,
    requiredSkills,
    status,
    assignees,
    assigneeWorkloads,
    allocationMode,
    projectId,
    project,
    forceCreate = false,
  } = taskData;

  const selectedProjectId = projectId || project;
  const selectedProject = await Project.findById(selectedProjectId);

  if (!selectedProject)
    return { status: 404, message: "Project not found." };

  if (deadline && selectedProject.endDate) {
    const projectEnd = new Date(selectedProject.endDate);
    const taskDeadline = new Date(`${String(deadline).slice(0, 10)}T00:00:00Z`);
    const projectEndUtc = new Date(
      Date.UTC(
        projectEnd.getUTCFullYear(),
        projectEnd.getUTCMonth(),
        projectEnd.getUTCDate()
      )
    );

    if (!Number.isNaN(taskDeadline.getTime()) && taskDeadline > projectEndUtc) {
      return {
        status: 400,
        field: "deadline",
        message: "Task deadline cannot be after the project end date.",
      };
    }
  }

  const [workspace, currentUser] = await Promise.all([
    Workspace.findOne({
      _id: selectedProject.workspace,
      projectAdmin: userId,
    }),
    User.findById(userId).select("role workspace"),
  ]);

  if (currentUser?.role === "Project Admin" && !workspace)
    return {
      status: 403,
      message: "Access denied. This project does not belong to your workspace.",
    };

  if (
    currentUser?.role === "Project Manager" &&
    (String(selectedProject.createdBy) !== String(userId) ||
      String(currentUser.workspace || "") !== String(selectedProject.workspace || ""))
  )
    return {
      status: 403,
      message: "Access denied. This project does not belong to your projects.",
    };

  const existingTask = await Task.findOne({
    project: selectedProjectId,
    taskTitle: { $regex: new RegExp(`^${taskTitle.trim()}$`, "i") },
  });

  if (existingTask)
    return {
      status: 409,
      message: "Task title already exists in this project.",
    };

  const normalizedAssigneeIds = [...new Set(
    (Array.isArray(assignees) ? assignees : [])
      .map(normalizeId)
      .filter(Boolean)
  )];

  const totalWorkload = getTotalTaskWorkload(size || "M");
  const builtAllocations = validateAndBuildAllocations({
    assigneeIds: normalizedAssigneeIds,
    totalPoints: totalWorkload,
    assigneeWorkloads,
    allocationMode,
  });

  if (builtAllocations?.error)
    return {
      status: 400,
      field: "assigneeWorkloads",
      message: builtAllocations.error,
    };

  const conflictResult = await getConflict({
    assignees: normalizedAssigneeIds,
    assigneeWorkloads: builtAllocations,
    priority,
    size,
    deadline,
  });

  if (
    conflictResult.hasConflict &&
    !(forceCreate && canForceAssign(userRole))
  )
    return conflictResponse(conflictResult);

  const task = await Task.create({
    taskTitle,
    description,
    project: selectedProjectId,
    createdBy: userId,
    assignedTo: normalizedAssigneeIds,
    assigneeWorkloads: builtAllocations,
    assigneeCompletion: normalizedAssigneeIds.map((member) => ({
      member,
      completed: false,
      completedAt: null,
    })),
    workload: totalWorkload,
    priority: priority || "Medium",
    size: size || "M",
    requiredSkills: requiredSkills || [],
    deadline: deadline || null,
    status: status || "Todo",
  });

  // Create task audit log
  try {
    await AuditLog.create({
      user: userId,
      workspace: selectedProject.workspace || null,
      action: "Created",
      module: "Task",
      description: `Task "${task.taskTitle}" was created`,
      targetId: task._id,
      targetName: task.taskTitle,
    });
  } catch (error) {
    console.error("Task Create Audit Log Error:", error.message);
  }

  const populatedTask = await Task.findById(task._id)
    .populate("createdBy", "fullName email")
    .populate("assignedTo", "fullName email");

  return {
    status: 201,
    message: "Task created successfully",
    task: { ...populatedTask.toObject(), commentsCount: 0 },
  };
};

const getTasksByProject = async (projectId, userId = null, userRole = null) => {
  if (!(await isProjectAdminWorkspaceAllowed(projectId, userId, userRole)))
    return getEmptyTasks();

  const tasks = await Task.find({ project: projectId })
    .populate("createdBy", "fullName email")
    .populate("assignedTo", "fullName email")
    .sort({ createdAt: -1 });

  return { status: 200, tasks: await attachCommentsCount(tasks) };
};

const getDashboardTasks = async (userId, userRole, workspaceId = null) => {
  const projectFilter = await getProjectFilter(userId, userRole, workspaceId);
  if (!projectFilter) return getEmptyTasks();

  const projects = await Project.find(projectFilter).select("_id");
  const tasks = await Task.find({
    project: { $in: projects.map((item) => item._id) },
  })
    .populate({
      path: "project",
      populate: { path: "workspace", select: "name" },
    })
    .populate("createdBy", "fullName email")
    .populate("assignedTo", "fullName email")
    .sort({ createdAt: -1 });

  return { status: 200, tasks: await attachCommentsCount(tasks) };
};

const getTaskInsights = async (userId, userRole, workspaceId = null) => {
  const projectFilter = await getProjectFilter(userId, userRole, workspaceId);
  if (!projectFilter) return getEmptyInsights();

  const projects = await Project.find(projectFilter).select("_id");
  const projectIds = projects.map((item) => item._id);

  if (!projectIds.length) return getEmptyInsights();

  const tasks = await Task.find({ project: { $in: projectIds } })
    .select(
      "taskTitle status priority size deadline progress workload assignedTo subtasks createdAt updatedAt"
    )
    .lean();

  const now = new Date();
  const insights = [];
  const addInsight = (task, type, level, message) =>
    insights.push({
      taskId: task._id,
      taskTitle: task.taskTitle,
      type,
      level,
      message,
    });

  for (const task of tasks) {
    const progress = Number(task.progress) || 0;
    const workload = Number(task.workload) || 0;
    const assignedCount = task.assignedTo?.length || 0;
    const subtasks = task.subtasks || [];
    const completedSubtasks = subtasks.filter((item) => item.completed).length;
    const deadline = task.deadline ? new Date(task.deadline) : null;
    const daysLeft = deadline
      ? Math.ceil((deadline - now) / 86400000)
      : null;
    const daysSinceUpdate = task.updatedAt
      ? Math.floor((now - new Date(task.updatedAt)) / 86400000)
      : 0;

    if (task.status !== "Completed" && deadline && daysLeft <= 3 && progress < 70)
      addInsight(
        task,
        "Deadline Pressure",
        daysLeft <= 1 ? "High" : "Medium",
        daysLeft < 0
          ? "Deadline has passed while the task is still incomplete."
          : `Only ${daysLeft} day${daysLeft === 1 ? "" : "s"} left and progress is ${progress}%.`
      );

    if (task.status !== "Completed" && daysSinceUpdate >= 5 && progress < 100)
      addInsight(
        task,
        "Low Activity",
        daysSinceUpdate >= 10 ? "High" : "Medium",
        `No task update has been recorded for ${daysSinceUpdate} days.`
      );

    if (task.status !== "Completed" && workload >= 70 && progress < 50)
      addInsight(
        task,
        "Workload Pattern",
        workload >= 90 ? "High" : "Medium",
        `Workload is ${workload}% while progress is only ${progress}%.`
      );

    if (
      subtasks.length >= 3 &&
      task.status !== "Completed" &&
      completedSubtasks === 0 &&
      progress > 0
    )
      addInsight(
        task,
        "Subtask Activity",
        "Medium",
        "The task has started, but none of its subtasks have been completed yet."
      );

    if (task.status !== "Completed" && assignedCount === 0 && progress < 100)
      addInsight(
        task,
        "Assignment Gap",
        "High",
        "This incomplete task currently has no assigned team member."
      );

    if (
      task.status === "In Progress" &&
      progress >= 80 &&
      (!deadline || daysLeft > 3)
    )
      addInsight(
        task,
        "Strong Progress",
        "Positive",
        `Task is ${progress}% complete with no immediate deadline pressure.`
      );
  }

  return {
    status: 200,
    insights,
    summary: {
      totalTasks: tasks.length,
      monitoredTasks: new Set(
        insights.map((item) => item.taskId.toString())
      ).size,
      high: insights.filter((item) => item.level === "High").length,
      medium: insights.filter((item) => item.level === "Medium").length,
      positive: insights.filter((item) => item.level === "Positive").length,
    },
  };
};

const getTaskById = async (taskId, userId = null, userRole = null) => {
  const basicTask = await Task.findById(taskId).select("project");
  if (!basicTask) return { status: 404, message: "Task not found" };

  if (!(await isProjectAdminWorkspaceAllowed(basicTask.project, userId, userRole)))
    return {
      status: 403,
      message: "Access denied. This task does not belong to your workspace.",
    };

  const task = await Task.findById(taskId)
    .populate({
      path: "project",
      populate: { path: "workspace", select: "name" },
    })
    .populate("createdBy", "fullName email")
    .populate("assignedTo", "fullName email")
    .populate("subtasks.assignedTo", "fullName email");

  if (!task) return { status: 404, message: "Task not found" };

  const taskObj = task.toObject();

  if (
    userRole?.toString().trim().toLowerCase().replace(/\s+/g, "") ===
    "teammember"
  )
    taskObj.subtasks = (taskObj.subtasks || []).filter(
      (subtask) =>
        subtask.assignedTo &&
        (subtask.assignedTo._id || subtask.assignedTo).toString() ===
          userId.toString()
    );

  taskObj.commentsCount = await Comment.countDocuments({ task: taskId });
  return { status: 200, task: taskObj };
};

const updateTask = async (taskId, updateData, userId = null, userRole = null) => {
  if (updateData.assignees && !updateData.assignedTo)
    updateData.assignedTo = updateData.assignees;

  const existingTask = await Task.findById(taskId);
  if (!existingTask) return { status: 404, message: "Task not found" };

  if (!(await isProjectAdminWorkspaceAllowed(existingTask.project, userId, userRole)))
    return {
      status: 403,
      message: "Access denied. This task does not belong to your workspace.",
    };

  if (updateData.taskTitle) {
    const newTitle = updateData.taskTitle.trim();

    if (
      await Task.findOne({
        _id: { $ne: taskId },
        project: existingTask.project,
        taskTitle: { $regex: `^${newTitle}$`, $options: "i" },
      })
    )
      return {
        status: 409,
        message: "Task title already exists in this project.",
      };

    updateData.taskTitle = newTitle;
  }

  const finalAssigneeIds = [...new Set(
    (updateData.assignees || updateData.assignedTo || existingTask.assignedTo || [])
      .map(normalizeId)
      .filter(Boolean)
  )];

  const finalSize = updateData.size || existingTask.size || "M";
  const totalWorkload = getTotalTaskWorkload(finalSize);
  const existingAssigneeIds = new Set(
    (existingTask.assignedTo || []).map(normalizeId).filter(Boolean)
  );
  const membershipChanged =
    finalAssigneeIds.length !== existingAssigneeIds.size ||
    finalAssigneeIds.some((id) => !existingAssigneeIds.has(id));

  const forceCreate = updateData.forceCreate === true;
  const allocationMode = updateData.allocationMode;
  const normalizedRole = userRole?.toString().trim().toLowerCase().replace(/\s+/g, "");

  // Carry forward per-member completion state when assignments change.
  const storedCompletion = Array.isArray(existingTask.assigneeCompletion)
    ? existingTask.assigneeCompletion
    : [];
  const previousCompletion = new Map(
    storedCompletion.map((item) => [
      normalizeId(item.member),
      { completed: item.completed === true, completedAt: item.completedAt || null },
    ])
  );

  // Older tasks did not have per-assignee completion records. If such a task
  // was already Completed, treat its existing completion as the baseline.
  if (!storedCompletion.length && existingTask.status === "Completed") {
    (existingTask.assignedTo || []).forEach((member) => {
      previousCompletion.set(normalizeId(member), {
        completed: true,
        completedAt: existingTask.updatedAt || new Date(),
      });
    });
  }
  const nextAssigneeCompletion = finalAssigneeIds.map((member) => {
    const previous = previousCompletion.get(member);
    return {
      member,
      completed: previous?.completed === true,
      completedAt: previous?.completedAt || null,
    };
  });

  if (normalizedRole === "teammember" && Object.prototype.hasOwnProperty.call(updateData, "status")) {
    const memberEntry = nextAssigneeCompletion.find(
      (item) => normalizeId(item.member) === String(userId)
    );
    if (!memberEntry) {
      return { status: 403, message: "You are not assigned to this task." };
    }

    memberEntry.completed = updateData.status === "Completed";
    memberEntry.completedAt = memberEntry.completed ? new Date() : null;

    const allMembersCompleted =
      nextAssigneeCompletion.length === 0 ||
      nextAssigneeCompletion.every((item) => item.completed);
    const subtasksCompleted =
      !(existingTask.subtasks || []).length ||
      (existingTask.subtasks || []).every((item) => item.completed === true);

    if (updateData.status === "Completed") {
      updateData.status = allMembersCompleted && subtasksCompleted
        ? "Completed"
        : "In Progress";
    } else {
      updateData.status = "In Progress";
    }
  }

  if (normalizedRole !== "teammember" && updateData.status === "Completed") {
    const allMembersCompleted =
      nextAssigneeCompletion.length <= 1
        ? true
        : nextAssigneeCompletion.every((item) => item.completed);
    const subtasksCompleted =
      !(existingTask.subtasks || []).length ||
      (existingTask.subtasks || []).every((item) => item.completed === true);

    if (!allMembersCompleted || !subtasksCompleted) {
      return {
        status: 400,
        field: "status",
        message: "This task cannot be marked Completed until all assignees and all subtasks are completed.",
      };
    }

    // A PM may complete a single-assignee task manually, preserving the
    // existing PM workflow. Multiple-assignee completion remains member-driven.
    if (nextAssigneeCompletion.length === 1) {
      nextAssigneeCompletion[0].completed = true;
      nextAssigneeCompletion[0].completedAt = new Date();
    }
  }

  if (normalizedRole !== "teammember" && updateData.status && updateData.status !== "Completed") {
    nextAssigneeCompletion.forEach((item) => {
      item.completed = false;
      item.completedAt = null;
    });
  }

  updateData.assigneeCompletion = nextAssigneeCompletion;

  // Re-evaluate the task as a whole after assignment/subtask changes.
  const allMembersCompleted =
    finalAssigneeIds.length === 0 ||
    nextAssigneeCompletion.every((item) => item.completed === true);
  const allSubtasksCompleted =
    !(existingTask.subtasks || []).length ||
    (existingTask.subtasks || []).every((item) => item.completed === true);

  if (allMembersCompleted && allSubtasksCompleted && finalAssigneeIds.length > 0) {
    updateData.status = "Completed";
  } else if (existingTask.status === "Completed") {
    updateData.status = "In Progress";
  }

  delete updateData.forceCreate;
  delete updateData.allocationMode;
  delete updateData.__v;

  let builtAllocations;

  if (finalAssigneeIds.length === 1) {
    builtAllocations = [{ member: finalAssigneeIds[0], workload: totalWorkload }];
  } else if (finalAssigneeIds.length > 1) {
    const hasAllocationPayload = Object.prototype.hasOwnProperty.call(
      updateData,
      "assigneeWorkloads"
    );
    if (allocationMode === "equal") {
      builtAllocations = buildEqualAllocations(finalAssigneeIds, totalWorkload);
    } else if (allocationMode === "manual" || hasAllocationPayload) {
      builtAllocations = validateAndBuildAllocations({
        assigneeIds: finalAssigneeIds,
        totalPoints: totalWorkload,
        assigneeWorkloads: updateData.assigneeWorkloads,
        allocationMode: "manual",
      });
    } else if (membershipChanged) {
      return {
        status: 400,
        field: "assigneeWorkloads",
        message:
          "When multiple assignees are selected, choose Equal Split or enter a Manual workload allocation.",
      };
    } else {
      // Backward compatibility for older tasks and API clients. Existing
      // allocations are scaled proportionally when the task size changes.
      builtAllocations = scaleAllocationsToTotal(
        finalAssigneeIds,
        existingTask.assigneeWorkloads,
        totalWorkload
      );
    }
  } else {
    builtAllocations = [];
  }

  if (builtAllocations?.error)
    return {
      status: 400,
      field: "assigneeWorkloads",
      message: builtAllocations.error,
    };

  if (Object.prototype.hasOwnProperty.call(updateData, "deadline")) {
    if (updateData.deadline && existingTask.project) {
      const project = await Project.findById(existingTask.project).select("endDate");
      if (project?.endDate) {
        const projectEnd = new Date(project.endDate);
        const taskDeadline = new Date(
          `${String(updateData.deadline).slice(0, 10)}T00:00:00Z`
        );
        const projectEndUtc = new Date(
          Date.UTC(
            projectEnd.getUTCFullYear(),
            projectEnd.getUTCMonth(),
            projectEnd.getUTCDate()
          )
        );

        if (!Number.isNaN(taskDeadline.getTime()) && taskDeadline > projectEndUtc) {
          return {
            status: 400,
            field: "deadline",
            message: "Task deadline cannot be after the project end date.",
          };
        }
      }
    }
  }

  updateData.assignedTo = finalAssigneeIds;
  updateData.assigneeWorkloads = builtAllocations;
  updateData.workload = totalWorkload;

  // Conflict checks during task editing are only for NEWLY assigned members.
  // Existing assignees are deliberately skipped, even when task details change.
  const newlyAssignedIds = finalAssigneeIds.filter(
    (id) => !existingAssigneeIds.has(id)
  );

  if (newlyAssignedIds.length > 0) {
    const newMemberAllocations = builtAllocations.filter((item) =>
      newlyAssignedIds.includes(normalizeId(item.member))
    );

    const conflictResult = await getConflict(
      {
        assignees: newlyAssignedIds,
        priority: updateData.priority || existingTask.priority || "Medium",
        size: finalSize,
        deadline: Object.prototype.hasOwnProperty.call(updateData, "deadline")
          ? updateData.deadline
          : existingTask.deadline,
        assigneeWorkloads: newMemberAllocations,
      },
      taskId
    );

    if (
      conflictResult.hasConflict &&
      !(forceCreate && canForceAssign(userRole))
    )
      return conflictResponse(conflictResult);
  }

  const task = await Task.findOneAndUpdate(
    { _id: taskId, __v: existingTask.__v },
    { $set: updateData, $inc: { __v: 1 } },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("createdBy", "fullName email")
    .populate("assignedTo", "fullName email");

  if (!task)
    return {
      status: 409,
      message: "Task was changed by another update. Please refresh and try again.",
    };

  // Sync project status
  if (updateData.status) {
    const siblingTasks = await Task.find({
      project: existingTask.project,
    }).select("status");

    const allCompleted =
      siblingTasks.length > 0 &&
      siblingTasks.every((item) => item.status === "Completed");

    const project = await Project.findById(existingTask.project);

    if (project) {
      if (allCompleted && project.status !== "Completed")
        project.status = "Completed";
      else if (!allCompleted && project.status === "Completed")
        project.status = "In Progress";

      if (project.isModified("status")) await project.save();
    }
  }

  try {
    const project = await Project.findById(existingTask.project).select("workspace");

    await AuditLog.create({
      user: userId,
      workspace: project?.workspace || null,
      action: "Updated",
      module: "Task",
      description: `Task "${task.taskTitle}" was updated`,
      targetId: task._id,
      targetName: task.taskTitle,
    });
  } catch (error) {
    console.error("Task Update Audit Log Error:", error.message);
  }

  return {
    status: 200,
    message: "Task updated successfully",
    memberCompletionChanged:
      normalizedRole === "teammember" &&
      Object.prototype.hasOwnProperty.call(updateData, "status"),
    task: {
      ...task.toObject(),
      commentsCount: await Comment.countDocuments({ task: taskId }),
    },
  };
};

const deleteTask = async (taskId, userId = null, userRole = null) => {
  const existingTask = await Task.findById(taskId);
  if (!existingTask) return { status: 404, message: "Task not found" };

  if (!(await isProjectAdminWorkspaceAllowed(existingTask.project, userId, userRole)))
    return {
      status: 403,
      message: "Access denied. This task does not belong to your workspace.",
    };

  const project = await Project.findById(existingTask.project).select("workspace");
  await Task.findByIdAndDelete(taskId);

  try {
    await AuditLog.create({
      user: userId,
      workspace: project?.workspace || null,
      action: "Deleted",
      module: "Task",
      description: `Task "${existingTask.taskTitle}" was deleted`,
      targetId: existingTask._id,
      targetName: existingTask.taskTitle,
    });
  } catch (error) {
    console.error("Task Delete Audit Log Error:", error.message);
  }

  await syncProjectCompletionStatus(existingTask.project);

  return { status: 200, message: "Task deleted successfully" };
};

const uploadTaskFile = async (taskId, fileData) => {
  const task = await Task.findById(taskId);
  if (!task) return { status: 404, message: "Task not found" };

  task.files.push(fileData);
  await task.save();
  return { status: 200, task };
};

const deleteTaskFile = async (taskId, fileId) => {
  const task = await Task.findById(taskId);
  if (!task) return { status: 404, message: "Task not found" };

  task.files = task.files.filter((file) => file._id.toString() !== fileId);
  await task.save();

  return { status: 200, task };
};

module.exports = {
  createTask,
  getTasksByProject,
  getDashboardTasks,
  getTaskInsights,
  getTaskById,
  updateTask,
  deleteTask,
  uploadTaskFile,
  deleteTaskFile,
};