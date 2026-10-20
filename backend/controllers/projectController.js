const projectService = require("../services/projectService");
const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const Workspace = require("../models/Workspace");
const { calculateWorkloadForMember } = require("../utils/workloadCalculator");

const cleanInput = (value) =>
  typeof value === "string"
    ? value
        .normalize("NFKC")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    : "";

const hasHtmlOrScript = (value) =>
  /<[^>]*>|\<script|<\/script|javascript:/i.test(value);

const hasSuspiciousInjection = (value) =>
  /\$where|\$ne|\$gt|\$gte|\$lt|\$lte|\$regex|\$exists|\$or|\$and|\$expr|\$function/i.test(
    value
  ) ||
  /^or$/i.test(value.trim()) ||
  /javascript:/i.test(value);

const hasSuspiciousObjectPattern = (value) =>
  /^\s*[\{\[].*[\}\]]\s*$/s.test(value);

const isOnlyRepeatedCharacter = (value) => {
  const compact = value.replace(/\s/g, "");
  return !!compact && compact.length >= 4 && /^(.)(?:\1)+$/u.test(compact);
};

const isOnlyNumbers = (value) => /^\d+$/.test(value.trim());
const isOnlySymbols = (value) => /^[^\p{L}\p{N}]+$/u.test(value.trim());
const hasConsecutiveSpaces = (value) => /\s{2,}/.test(value);
const hasConsecutiveSpecialChars = (value) => /[-',]{2,}/.test(value);
const startsOrEndsWithSpecialChar = (value) =>
  /^[-',]|[-',]$/u.test(value.trim());
const hasInvalidStandaloneSpecial = (value) => /^[-,']+$/.test(value.trim());

// Require at least two alphabetic letters in meaningful text.
const hasFewerThanTwoLetters = (value) =>
  (value.match(/\p{L}/gu) || []).length < 2;

// Strict YYYY-MM-DD validation that also rejects impossible calendar dates.
const isValidDateInput = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasDuplicateWord = (value) => {
  const words = value
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  for (let i = 1; i < words.length; i++) {
    if (words[i] === words[i - 1]) return true;
  }

  return false;
};

const hasRepeatingPattern = (value) => {
  const compact = value.replace(/\s/g, "").toLowerCase();

  if (compact.length < 6) return false;
  for (let size = 1; size <= Math.floor(compact.length / 2); size++) {
    if (compact.length % size !== 0) continue;
    const pattern = compact.slice(0, size);
    if (pattern.repeat(compact.length / size) === compact) {
      return true;
    }
  }
  return false;
};

const hasGarbagePattern = (value) => {
  const normalized = value.toLowerCase().replace(/[^a-z]/g, "");
  return ["asdf", "asdfgh", "qwer", "qwerty", "qwertyui", "zxcv", "zxcvbn", "poiuy", "lkjhg", "mnbvc", "hjkl", "testtest", "abcabc", "xyzxyz", "123123", "000000", "111111", "222222", "333333", "444444", "555555", "666666", "777777", "888888", "999999",
  ].some((pattern) => normalized.includes(pattern));
};

const hasMostlySameCharacter = (value) => {
  const compact = value.replace(/\s/g, "").toLowerCase();
  if (compact.length < 5) return false;
  const counts = {};
  for (const char of compact) {
    counts[char] = (counts[char] || 0) + 1;
  }
  return Math.max(...Object.values(counts)) / compact.length >= 0.8;
};

const validateMeaningfulText = (value, minimumLength) => {
  const text = cleanInput(value).trim();

  if (!text) return "This field is required.";

  if (text.length < minimumLength) {
    return `Must be at least ${minimumLength} characters.`;
  }

  if (hasFewerThanTwoLetters(text)) {
    return "Text must contain at least 2 letters.";
  }
  if (isOnlyNumbers(text)) return "Only numbers are not allowed.";

  if (isOnlySymbols(text)) return "Only symbols are not allowed.";
  
  if (isOnlyRepeatedCharacter(text)) {
    return "Repeated single characters are not allowed.";
  }

  if (hasGarbagePattern(text)) {
    return "Please enter meaningful text.";
  }
  if (hasRepeatingPattern(text)) {
    return "Repeating patterns are not allowed.";
  }

  if (hasConsecutiveSpaces(text)) {
    return "Multiple consecutive spaces are not allowed.";
  }

  if (hasConsecutiveSpecialChars(text)) {
    return "Consecutive special characters are not allowed.";
  }

  if (startsOrEndsWithSpecialChar(text)) {
    return "Text cannot start or end with -, , or '.";
  }

  if (hasInvalidStandaloneSpecial(text)) {
    return "Invalid special character input.";
  }

  if (hasDuplicateWord(text)) {
    return "Duplicate words are not allowed.";
  }

  if (hasMostlySameCharacter(text)) {
    return "Text contains too many repeated characters.";
  }

  if (hasHtmlOrScript(text)) {
    return "HTML or script input is not allowed.";
  }

  if (hasSuspiciousInjection(text)) {
    return "Invalid or suspicious input detected.";
  }

  if (hasSuspiciousObjectPattern(text)) {
    return "Object-style input is not allowed.";
  }

  return null;
};

const validateProjectName = (value) => {
  const text = cleanInput(value).trim();

  if (!text) return "Project name is required.";

  if (text.length < 3) {
    return "Project name must be at least 3 characters.";
  }

  if (text.length > 300) {
    return "Project name cannot exceed 300 characters.";
  }

  if (/\d/.test(text)) {
    return "Project name cannot contain numbers.";
  }

  return validateMeaningfulText(text, 3);
};

const validateProjectDescription = (value) => {
  const text = cleanInput(value).trim();

  if (!text) return "Description is required.";

  if (text.length < 8) {
    return "Description must be at least 8 characters.";
  }

  if (text.length > 1000) {
    return "Description cannot exceed 1000 characters.";
  }

  if (text.split(/\s+/).filter(Boolean).length < 2) {
    return "Description must contain at least 2 words.";
  }

  return validateMeaningfulText(text, 8);
};

const validateProjectPayload = (body, { isCreate = false } = {}) => {
  const projectName = cleanInput(body?.projectName).trim();
  const description = cleanInput(body?.description).trim();
  const nameError = validateProjectName(projectName);

  if (nameError) {
    return {
      message: nameError,
      field: "projectName",
    };
  }

  const descriptionError = validateProjectDescription(description);

  if (descriptionError) {
    return {
      message: descriptionError,
      field: "description",
    };
  }

  // Keep backend status rules aligned with the Project form.
  // Creation starts only in Planning. During edit, the current status may be
  // submitted unchanged, while manual status changes are limited to On Hold
  // and Cancelled. In Progress/Completed are controlled by task activity.
  if (isCreate) {
    if (body?.status !== "Planning") {
      return {
        message: "New projects can only use Planning status.",
        field: "status",
      };
    }
  } else if (body?.status !== undefined && ![
    "Planning",
    "In Progress",
    "On Hold",
    "Completed",
    "Cancelled",
  ].includes(body.status)) {
    return {
      message: "Invalid project status.",
      field: "status",
    };
  }

  if (!body?.startDate) {
    return {
      message: "Start date is required.",
      field: "startDate",
    };
  }

  if (!isValidDateInput(body.startDate)) {
    return {
      message:
        "Start date is invalid. Please provide a valid date in YYYY-MM-DD format.",
      field: "startDate",
    };
  }

  if (!body?.endDate) {
    return {
      message: "End date is required.",
      field: "endDate",
    };
  }

  if (!isValidDateInput(body.endDate)) {
    return {
      message:
        "End date is invalid. Please provide a valid date in YYYY-MM-DD format.",
      field: "endDate",
    };
  }

  if (body.endDate < body.startDate) {
    return {
      message: "End date cannot be before start date.",
      field: "endDate",
    };
  }

  return null;
};

const createProject = async (req, res) => {
  try {
    const validationError = validateProjectPayload(req.body, {
      isCreate: true,
    });

    if (validationError) {
      return res.status(400).json({
        status: 400,
        message: validationError.message,
        field: validationError.field,
      });
    }

    // Reject duplicate project names in the same workspace at the controller
    // layer as well as in the service/database. Comparison is case-insensitive.
    const createWorkspaceId = req.body?.workspace || req.body?.workspaceId;

    if (!createWorkspaceId) {
      return res.status(400).json({
        status: 400,
        message: "Workspace is required.",
        field: "workspace",
      });
    }

    const duplicateProject = await Project.findOne({
      workspace: createWorkspaceId,
      projectName: {
        $regex: new RegExp(
          `^${escapeRegex(req.body.projectName.trim())}$`,
          "i"
        ),
      },
    }).select("_id projectName");

    if (duplicateProject) {
      return res.status(409).json({
        status: 409,
        message: "Project name already exists. Choose a different name.",
        field: "projectName",
      });
    }

    const result = await projectService.createProject(
      req.body,
      req.user.id,
      req.user.role
    );

    if (result.status === 201 && result.project) {
      try {
        await AuditLog.create({
          user: req.user.id,
          workspace: result.project.workspace || null,
          action: "Created",
          module: "Project",
          description: `Project "${result.project.projectName}" was created`,
          targetId: result.project._id,
          targetName: result.project.projectName,
          ipAddress: req.ip || "",
        });
      } catch (auditError) {
        console.error("Create Project Audit Log Error:", auditError);
      }
    }

    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Create Project Controller Error:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        status: 409,
        message: "Project name already exists. Choose a different name.",
        field: "projectName",
      });
    }

    return res.status(500).json({ message: "Server Error" });
  }
};

const getProjectsByWorkspace = async (req, res) => {
  try {
    const workspaceId =
      req.params.workspaceId ||
      req.params.id ||
      req.query.workspaceId;

    if (!workspaceId) {
      return res.status(400).json({
        status: 400,
        message: "Workspace ID is required",
      });
    }

    const result = await projectService.getProjectsByWorkspace(
      workspaceId,
      req.user.id,
      req.user.role
    );

    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Get Projects Controller Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

const getDashboardProjects = async (req, res) => {
  try {
    const { workspaceId } = req.query;

    const result = await projectService.getDashboardProjects(
      workspaceId,
      req.user.id,
      req.user.role
    );

    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Dashboard Projects Controller Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

const getProjectReport = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    const project = await Project.findById(projectId).populate(
      "createdBy",
      "fullName email"
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (req.user.role === "Project Admin") {
      const allowedWorkspace = await Workspace.findOne({
        _id: project.workspace,
        projectAdmin: req.user.id,
      }).select("_id");

      if (!allowedWorkspace) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access this project report",
        });
      }
    } else if (
      req.user.role === "Project Manager" &&
      String(project.createdBy?._id || project.createdBy) !==
        String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this project report",
      });
    }

    // Team Performance is based only on members actually added to this project.
    const projectMembers = await User.find({
      _id: { $in: project.members || [] },
      role: { $nin: ["Project Admin", "Project Manager"] },
    }).select("fullName email role");

    const tasks = await Task.find({
      project: projectId,
    }).populate("assignedTo", "fullName email role");

    let todoCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let highPriorityCount = 0;
    let mediumPriorityCount = 0;
    let lowPriorityCount = 0;

    const teamStats = {};

    for (const user of projectMembers) {
      const liveData = await calculateWorkloadForMember(user._id);

      teamStats[user._id.toString()] = {
        name: user.fullName || "Team Member",
        email: user.email,
        workload: liveData.workload,
        availability: liveData.availability,
        totalTasks: 0,
        completedTasks: 0,
      };
    }

    tasks.forEach((task) => {
      if (task.status === "Todo") todoCount++;
      else if (task.status === "In Progress") inProgressCount++;
      else if (task.status === "Completed") completedCount++;

      if (task.priority === "High") highPriorityCount++;
      else if (task.priority === "Medium") mediumPriorityCount++;
      else if (task.priority === "Low") lowPriorityCount++;

      if (task.assignedTo && task.assignedTo.length > 0) {
        task.assignedTo.forEach((user) => {
          if (
            user.role === "Project Admin" ||
            user.role === "Project Manager"
          ) {
            return;
          }

          const userIdStr = user._id.toString();

          if (teamStats[userIdStr]) {
            teamStats[userIdStr].totalTasks++;

            if (task.status === "Completed") {
              teamStats[userIdStr].completedTasks++;
            }
          }
        });
      }
    });

    const teamPerformanceArray = Object.values(teamStats).map((member) => ({
      name: member.name,
      email: member.email,
      totalTasks: member.totalTasks,
      completedTasks: member.completedTasks,
      completionRate:
        member.totalTasks > 0
          ? Math.round(
              (member.completedTasks / member.totalTasks) * 100
            )
          : 0,
      workload: member.workload,
      availability: member.availability,
    }));

    const totalTasks = tasks.length;

    const projectProgress =
      totalTasks > 0
        ? Math.round((completedCount / totalTasks) * 100)
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        projectDetails: {
          id: project._id,
          projectName: project.projectName,
          description: project.description,
          status: project.status,
          startDate: project.startDate,
          endDate: project.endDate,
          calculatedProgress: projectProgress,
        },
        taskBreakdown: {
          totalTasks,
          todo: todoCount,
          inProgress: inProgressCount,
          completed: completedCount,
        },
        priorityMetrics: {
          high: highPriorityCount,
          medium: mediumPriorityCount,
          low: lowPriorityCount,
        },
        teamPerformance: teamPerformanceArray,
        rawTasksList: tasks.map((task) => ({
          id: task._id,
          taskTitle: task.taskTitle,
          status: task.status,
          priority: task.priority,
          progress: task.progress,
          deadline: task.deadline,
        })),
      },
    });
  } catch (error) {
    console.error("Get Project Report Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.params.id;

    const result = await projectService.getProjectById(
      projectId,
      req.user.id,
      req.user.role
    );

    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Get Single Project Details Controller Error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const validationError = validateProjectPayload(req.body);

    if (validationError) {
      return res.status(400).json({
        status: 400,
        message: validationError.message,
        field: validationError.field,
      });
    }

    const projectId = req.params.projectId || req.params.id;
    const existingProject = await Project.findById(projectId);

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const updateWorkspaceId =
      req.body?.workspace ||
      req.body?.workspaceId ||
      existingProject.workspace;

    if (req.body?.projectName) {
      const duplicateProject = await Project.findOne({
        _id: { $ne: projectId },
        workspace: updateWorkspaceId,
        projectName: {
          $regex: new RegExp(
            `^${escapeRegex(req.body.projectName.trim())}$`,
            "i"
          ),
        },
      }).select("_id projectName");

      if (duplicateProject) {
        return res.status(409).json({
          status: 409,
          message: "Project name already exists. Choose a different name.",
          field: "projectName",
        });
      }
    }

    const result = await projectService.updateProject(
      projectId,
      req.body,
      req.user.id,
      req.user.role
    );

    if (result.status === 200 && result.project) {
      try {
        await AuditLog.create({
          user: req.user.id,
          workspace:
            result.project.workspace?._id ||
            result.project.workspace ||
            existingProject.workspace ||
            null,
          action: "Updated",
          module: "Project",
          description: `Project "${result.project.projectName}" was updated`,
          targetId: result.project._id,
          targetName: result.project.projectName,
          ipAddress: req.ip || "",
        });
      } catch (auditError) {
        console.error("Update Project Audit Log Error:", auditError);
      }
    }

    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Update Project Controller Error:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        status: 409,
        message: "Project name already exists. Choose a different name.",
        field: "projectName",
      });
    }

    return res.status(500).json({ message: "Server Error" });
  }
};

const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.params.id;

    if (!projectId) {
      return res.status(400).json({
        status: 400,
        message: "Project ID is required",
      });
    }

    const existingProject = await Project.findById(projectId);

    if (!existingProject) {
      return res.status(404).json({
        status: 404,
        message: "Project not found",
      });
    }

    const result = await projectService.deleteProject(
      projectId,
      req.user.id,
      req.user.role
    );

    if (result.status === 200) {
      try {
        await AuditLog.create({
          user: req.user.id,
          workspace: existingProject.workspace || null,
          action: "Deleted",
          module: "Project",
          description: `Project "${existingProject.projectName}" was deleted`,
          targetId: existingProject._id,
          targetName: existingProject.projectName,
          ipAddress: req.ip || "",
        });
      } catch (auditError) {
        console.error("Delete Project Audit Log Error:", auditError);
      }
    }

    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Delete Project Controller Error:", error);

    return res.status(500).json({
      status: 500,
      message: "Server Error",
    });
  }
};

const getWorkspaceMembers = async (req, res) => {
  try {
    const result = await projectService.getWorkspaceMembers(
      req.params.id,
      req.user.id,
      req.user.role
    );

    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Get Workspace Members Error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

const getWorkspaceManagers = async (req, res) => {
  try {
    const result = await projectService.getWorkspaceManagers(
      req.params.id,
      req.user.id,
      req.user.role
    );

    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Get Workspace Managers Error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

const getProjectMembers = async (req, res) => {
  try {
    const result = await projectService.getProjectMembers(
      req.params.id,
      req.user.id,
      req.user.role
    );

    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Get Project Members Error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

const updateProjectMembers = async (req, res) => {
  try {
    const result = await projectService.updateProjectMembers(
      req.params.id,
      req.body.members,
      req.user.id,
      req.user.role
    );

    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Update Project Members Error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

module.exports = {
  createProject,
  getProjectsByWorkspace,
  getDashboardProjects,
  getProjectReport,
  getProjectById,
  updateProject,
  deleteProject,
  getWorkspaceMembers,
  getWorkspaceManagers,
  updateProjectMembers,
  getProjectMembers,
};