const Task = require("../models/Task");
const User = require("../models/User");
const { SIZE_POINTS, MAX_CAPACITY } = require("./workloadCalculator");
const ACTIVE_STATUSES = ["Todo", "In Progress"];
const normalizeId = (value) => value?.toString();

const normalizeDateKey = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

// Format deadline for conflict messages
const formatDate = (value) => {
  const key = normalizeDateKey(value);
  if (!key) return "No deadline";

  const [year, month, day] = key.split("-");
  const monthName = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day))
  ).toLocaleString("en-US", { month: "long", timeZone: "UTC" });

  return `${day} ${monthName} ${year}`;
};

// Detect workload and deadline conflicts
const detectTaskConflicts = async ({
  assignees = [],
  priority = "Medium",
  size = "M",
  deadline = null,
  assigneeWorkloads = [],
  currentTaskId = null,
}) => {
  const memberIds = [...new Set(assignees.map(normalizeId).filter(Boolean))];

  if (!memberIds.length)
    return {
      hasConflict: false,
      workloadConflicts: [],
      taskConflicts: [],
    };

  const memberDocs = await User.find({
    _id: { $in: memberIds },
  }).select("fullName");

  const memberNames = new Map(
    memberDocs.map((member) => [
      normalizeId(member._id),
      member.fullName || "This member",
    ])
  );

  const query = {
    assignedTo: { $in: memberIds },
    status: { $in: ACTIVE_STATUSES },
    ...(currentTaskId && { _id: { $ne: currentTaskId } }),
  };

  const existingTasks = await Task.find(query)
    .select("taskTitle assignedTo assigneeWorkloads priority size workload deadline status")
    .lean();

  const workloadConflicts = [];
  const taskConflicts = [];
  const newDeadlineKey = normalizeDateKey(deadline);

  const getLegacyOrAllocatedPoints = (task, memberId) => {
    const totalPoints =
      SIZE_POINTS[task.size] || Number(task.workload) || 0;

    if (Array.isArray(task.assigneeWorkloads) && task.assigneeWorkloads.length) {
      const allocation = task.assigneeWorkloads.find(
        (item) => normalizeId(item.member) === memberId
      );
      return allocation ? Number(allocation.workload) || 0 : 0;
    }

    const assigneeIds = (task.assignedTo || []).map(normalizeId).filter(Boolean);
    if (assigneeIds.length === 1) return totalPoints;

    // Legacy multi-assignee tasks: split total effort equally.
    return assigneeIds.length ? totalPoints / assigneeIds.length : 0;
  };

  for (const member of memberDocs) {
    const memberId = normalizeId(member._id);
    const memberName = memberNames.get(memberId) || "This member";
    const memberTasks = existingTasks.filter((task) =>
      (task.assignedTo || []).some(
        (id) => normalizeId(id) === memberId
      )
    );

    const currentPoints = memberTasks.reduce(
      (sum, task) => sum + getLegacyOrAllocatedPoints(task, memberId),
      0
    );

    const currentWorkload = Math.round(
      (currentPoints / MAX_CAPACITY) * 100
    );

    const allocation = Array.isArray(assigneeWorkloads)
      ? assigneeWorkloads.find(
          (item) => normalizeId(item.member) === memberId
        )
      : null;

    const newTaskPoints = allocation
      ? Number(allocation.workload) || 0
      : SIZE_POINTS[size] || 0;

    const newTotalPoints = currentPoints + newTaskPoints;
    if (newTotalPoints > MAX_CAPACITY) {
      const currentWorkload = Math.round(
        (currentPoints / MAX_CAPACITY) * 100
      );

      workloadConflicts.push({
        memberId,
        memberName: memberNames.get(memberId) || "This member",
        currentPoints,
        currentWorkload,
        newTaskPoints,
        newTotalPoints,
        maxPoints: MAX_CAPACITY,
        message: `${memberName} is currently at ${currentWorkload}% capacity with ${currentPoints} active points. Assigning this ${size} task will add ${newTaskPoints} points, pushing their total workload to ${newTotalPoints} points, which exceeds the maximum safety limit of ${MAX_CAPACITY} points.`,
      });
    }

    if (newDeadlineKey && ["Low", "Medium", "High"].includes(priority)) {
      const priorityPair = (newPriority, existingPriority) => {
        if (newPriority === "High" && existingPriority === "High") return "Strong Warning";
        if (
          (newPriority === "High" && existingPriority === "Medium") ||
          (newPriority === "Medium" && existingPriority === "High") ||
          (newPriority === "Medium" && existingPriority === "Medium") ||
          (newPriority === "Low" && existingPriority === "Low")
        ) return "Warning";
        return null;
      };

      const matchingTasks = memberTasks.filter(
        (task) => normalizeDateKey(task.deadline) === newDeadlineKey
      );

      matchingTasks.forEach((matchingTask) => {
        const severity = priorityPair(priority, matchingTask.priority);
        if (!severity) return;

        const warningText =
          severity === "Strong Warning"
            ? "Both tasks are High Priority and have the same deadline."
            : `${priority} + ${matchingTask.priority} tasks have the same deadline.`;

        taskConflicts.push({
          memberId,
          memberName,
          existingTaskId: matchingTask._id,
          existingTaskTitle: matchingTask.taskTitle,
          existingPriority: matchingTask.priority,
          newPriority: priority,
          deadline: newDeadlineKey,
          severity,
          message: `${memberName} has an existing ${matchingTask.priority} Priority task ("${matchingTask.taskTitle}") with the same deadline (${formatDate(deadline)}). New task: ${priority} Priority. ${warningText}`
        });
      });
    }
  }

  const hasStrongTaskConflict = taskConflicts.some(
    (conflict) => conflict.severity === "Strong Warning"
  );

  return {
    hasConflict: workloadConflicts.length > 0 || taskConflicts.length > 0,
    severity: hasStrongTaskConflict ? "Strong Warning" : "Warning",
    workloadConflicts,
    taskConflicts,
  };
};

module.exports = {
  detectTaskConflicts,
  ACTIVE_STATUSES,
};