const Task = require("../models/Task");

const SIZE_POINTS = { XS: 5, S: 10, M: 20, L: 40, XL: 80 };
const MAX_CAPACITY = 160;

const normalizeId = (value) =>
  value?._id ? value._id.toString() : value?.toString();

// Legacy tasks did not have per-member allocations. For those tasks, a
// multi-assignee task is split equally so the same total effort is not
// counted multiple times against every member.
const getTaskPointsForMember = (task, userId) => {
  const totalPoints = SIZE_POINTS[task.size] || Number(task.workload) || 0;
  const memberId = normalizeId(userId);

  if (Array.isArray(task.assigneeWorkloads) && task.assigneeWorkloads.length) {
    const allocation = task.assigneeWorkloads.find(
      (item) => normalizeId(item.member) === memberId
    );
    return allocation ? Number(allocation.workload) || 0 : 0;
  }

  const assigneeIds = (task.assignedTo || []).map(normalizeId).filter(Boolean);
  if (!assigneeIds.length) return 0;

  // Preserve normal single-assignee behaviour.
  if (assigneeIds.length === 1) return totalPoints;

  // Backward-compatible fallback for old multi-assignee tasks.
  return totalPoints / assigneeIds.length;
};

// Calculate member workload and availability from active task allocations.
const calculateWorkloadForMember = async (userId) => {
  const tasks = await Task.find({
    assignedTo: userId,
    status: { $in: ["Todo", "In Progress"] },
  }).select("assignedTo assigneeWorkloads size workload");

  const totalPoints = tasks.reduce(
    (sum, task) => sum + getTaskPointsForMember(task, userId),
    0
  );

  const workload = Math.round((totalPoints / MAX_CAPACITY) * 100);
  const availability =
    workload <= 40
      ? "Available"
      : workload <= 74
      ? "Busy"
      : workload <= 90
      ? "At Capacity"
      : "Overloaded";

  return {
    workload,
    availability,
    totalPoints,
    maxPoints: MAX_CAPACITY,
  };
};

module.exports = {
  calculateWorkloadForMember,
  SIZE_POINTS,
  MAX_CAPACITY,
  getTaskPointsForMember,
};
