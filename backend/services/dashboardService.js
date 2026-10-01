const Workspace = require("../models/Workspace");
const Project = require("../models/Project");
const Task = require("../models/Task");

// Get Project Admin dashboard data
const getDashboardData = async (projectAdminId, workspaceId) => {
  // Get accessible workspaces
  const workspaces = await Workspace.find({
    projectAdmin: projectAdminId,
    ...(workspaceId && { _id: workspaceId }),
  }).select("_id");

  const workspaceIds = workspaces.map((workspace) => workspace._id);

  if (!workspaceIds.length)
    return {
      status: 200,
      dashboard: {
        workspaces: 0,
        projects: 0,
        tasks: 0,
        completion: 0,
        statusOverview: {
          planning: 0,
          inProgress: 0,
          completed: 0,
        },
        deadlineDistribution: [],
        trendData: [],
        projectProgressData: [],
        recentProjects: [],
      },
    };

  const projectFilter = {
    workspace: workspaceId ? workspaceId : { $in: workspaceIds },
  };

  // Get workspace projects
  const projects = await Project.find(projectFilter).select(
    "_id projectName status createdAt workspace"
  );

  const projectIds = projects.map((project) => project._id);

  // Get all tasks once for dashboard calculations
  const tasks = await Task.find({
    project: { $in: projectIds },
  }).select("status deadline createdAt project");

  const totalWorkspaces = workspaceIds.length;
  const totalProjects = projectIds.length;
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const todoTasks = tasks.filter(
    (task) => task.status === "Todo" || task.status === "To Do"
  ).length;

  // Calculate overall completion
  const completion = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  // Calculate project status overview
  const planningProjects = projects.filter(
    (project) => project.status === "Planning"
  ).length;

  const inProgressProjects = projects.filter(
    (project) => project.status === "In Progress"
  ).length;

  const completedProjects = projects.filter(
    (project) => project.status === "Completed"
  ).length;

  // Calculate task deadline distribution
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const endOfThisWeek = new Date(now);
  endOfThisWeek.setDate(endOfThisWeek.getDate() + 7);
  endOfThisWeek.setHours(23, 59, 59, 999);

  let overdue = 0;
  let dueToday = 0;
  let dueThisWeek = 0;
  let upcoming = 0;

  tasks
    .filter((task) => task.status !== "Completed" && task.deadline)
    .forEach((task) => {
      const deadline = new Date(task.deadline);

      if (deadline < startOfToday) overdue++;
      else if (deadline <= endOfToday) dueToday++;
      else if (deadline <= endOfThisWeek) dueThisWeek++;
      else upcoming++;
    });

  const deadlineDistribution = [
    { name: "Overdue", value: overdue },
    { name: "Due Today", value: dueToday },
    { name: "Due This Week", value: dueThisWeek },
    { name: "Upcoming", value: upcoming },
  ];

  // Get five most recent projects
  const recentProjects = await Project.find(projectFilter)
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Calculate progress for recent projects
  const recentProjectsWithProgress = recentProjects.map((project) => {
    const projectTasks = tasks.filter(
      (task) => String(task.project) === String(project._id)
    );

    const tasksCount = projectTasks.length;
    const completed = projectTasks.filter(
      (task) => task.status === "Completed"
    ).length;

    const inProgress = projectTasks.filter(
      (task) => task.status === "In Progress"
    ).length;

    const todo = projectTasks.filter(
      (task) => task.status === "Todo" || task.status === "To Do"
    ).length;

    const projectStatus = project.status?.toString().trim().toLowerCase();

    const progress =
      projectStatus === "planning"
        ? 0
        : projectStatus === "in progress" ||
          projectStatus === "in-progress"
        ? 50
        : projectStatus === "completed"
        ? 100
        : tasksCount
        ? Math.round((completed / tasksCount) * 100)
        : 0;

    return {
      ...project,
      tasksCount,
      completedTasks: completed,
      inProgressTasks: inProgress,
      todoTasks: todo,
      progress,
    };
  });

  // Prepare project progress chart data
  const projectProgressData = recentProjectsWithProgress.map((project) => ({
    name: project.projectName || "Untitled",
    progress: project.progress || 0,
    todo: project.todoTasks || 0,
    inProgress: project.inProgressTasks || 0,
    completed: project.completedTasks || 0,
  }));

  // Calculate task activity for the last seven days
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const trendData = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dayTasks = tasks.filter(
      (task) =>
        task.createdAt >= startOfDay &&
        task.createdAt <= endOfDay
    );

    trendData.push({
      day: days[date.getDay()],
      todo: dayTasks.filter(
        (task) => task.status === "Todo" || task.status === "To Do"
      ).length,
      inProgress: dayTasks.filter(
        (task) => task.status === "In Progress"
      ).length,
      completed: dayTasks.filter(
        (task) => task.status === "Completed"
      ).length,
    });
  }

  return {
    status: 200,
    dashboard: {
      workspaces: totalWorkspaces,
      projects: totalProjects,
      tasks: totalTasks,
      completion,
      statusOverview: {
        planning: planningProjects,
        inProgress: inProgressProjects,
        completed: completedProjects,
      },
      deadlineDistribution,
      trendData,
      projectProgressData,
      recentProjects: recentProjectsWithProgress,
    },
  };
};

module.exports = {
  getDashboardData,
};