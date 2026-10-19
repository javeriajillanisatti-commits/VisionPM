const taskService = require("../services/taskService");
const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { createNotification } = require("../utils/notify");
const { sendInvite } = require("../services/inviteService");

const normalizeUserId = value =>
  value?._id ? value._id.toString() : value?.toString();

const syncProjectStatusAfterTaskChange = async projectId => {
  if (!projectId) return;

  const [project, tasks] = await Promise.all([
    Project.findById(projectId),
    Task.find({ project: projectId }).select("status"),
  ]);

  if (!project || !tasks.length) return;

  const hasInProgressTask = tasks.some(task => task.status === "In Progress");
  const allCompleted = tasks.every(task => task.status === "Completed");

  if (hasInProgressTask && project.status !== "In Progress") {
    project.status = "In Progress";
    await project.save();
  } else if (allCompleted && project.status !== "Completed") {
    project.status = "Completed";
    await project.save();
  } else if (!allCompleted && project.status === "Completed") {
    project.status = "In Progress";
    await project.save();
  }
};

const cleanInput = value =>
  typeof value === "string"
    ? value
        .normalize("NFKC")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    : "";

const hasHtmlOrScript = value =>
  /<[^>]*>|<script|<\/script|javascript:/i.test(value);

const hasSuspiciousInjection = value =>
  /\$where|\$ne|\$gt|\$gte|\$lt|\$lte|\$regex|\$exists|\$or|\$and|\$expr|\$function/i.test(
    value
  ) ||
  /^or$/i.test(value.trim()) ||
  /javascript:/i.test(value);

const hasSuspiciousObjectPattern = value =>
  /^\s*[\{\[].*[\}\]]\s*$/s.test(value);

const isOnlyRepeatedCharacter = value => {
  const compact = value.replace(/\s/g, "");
  return !!compact && compact.length >= 4 && /^(.)(?:\1)+$/u.test(compact);
};

const isOnlyNumbers = value => /^\d+$/.test(value.trim());

const isOnlySymbols = value =>
  /^[^\p{L}\p{N}]+$/u.test(value.trim());

const hasConsecutiveSpaces = value => /\s{2,}/.test(value);

const hasConsecutiveSpecialChars = value =>
  /[-',]{2,}/.test(value);

const startsOrEndsWithSpecialChar = value =>
  /^[-',]|[-',]$/u.test(value.trim());

const hasInvalidStandaloneSpecial = value =>
  /^[-,']+$/.test(value.trim());

const hasDuplicateWord = value => {
  const words = value
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words.some(
    (word, i) => i > 0 && word === words[i - 1]
  );
};

const hasRepeatingPattern = value => {
  const compact = value
    .replace(/\s/g, "")
    .toLowerCase();

  if (compact.length < 6) return false;

  for (
    let size = 1;
    size <= Math.floor(compact.length / 2);
    size++
  ) {
    if (compact.length % size) continue;

    const pattern = compact.slice(0, size);

    if (
      pattern.repeat(compact.length / size) === compact
    ) {
      return true;
    }
  }

  return false;
};

const hasGarbagePattern = value => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  return [
    "asdf",
    "asdfgh",
    "asdfghj",
    "qwer",
    "qwerty",
    "qwertyui",
    "zxcv",
    "zxcvbn",
    "poiuy",
    "lkjhg",
    "mnbvc",
    "hjkl",
    "testtest",
    "abcabc",
    "xyzxyz",
    "123123",
    "000000",
    "111111",
    "222222",
    "333333",
    "444444",
    "555555",
    "666666",
    "777777",
    "888888",
    "999999",
  ].some(pattern => normalized.includes(pattern));
};

const hasMostlySameCharacter = value => {
  const compact = value
    .replace(/\s/g, "")
    .toLowerCase();

  if (compact.length < 5) return false;

  const counts = {};

  for (const char of compact) {
    counts[char] = (counts[char] || 0) + 1;
  }

  return (
    Math.max(...Object.values(counts)) /
      compact.length >=
    0.8
  );
};

const hasEnoughLetters = value =>
  (value.match(/[A-Za-z]/g) || []).length >= 2;

const validateMeaningfulText = (
  value,
  fieldName,
  minimumLength
) => {
  const text = cleanInput(value).trim();

  if (!text) {
    return `${fieldName} is required.`;
  }

  if (text.length < minimumLength) {
    return `${fieldName} must be at least ${minimumLength} characters.`;
  }

  if (isOnlyNumbers(text)) {
    return "Only numbers are not allowed.";
  }

  if (isOnlySymbols(text)) {
    return "Only symbols are not allowed.";
  }

  if (!hasEnoughLetters(text)) {
    return `${fieldName} must contain at least 2 letters.`;
  }

  if (isOnlyRepeatedCharacter(text)) {
    return "Repeated single characters are not allowed.";
  }

  if (hasGarbagePattern(text)) {
    return `Please enter meaningful ${fieldName.toLowerCase()}.`;
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
    return "Duplicate consecutive words are not allowed.";
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

const validateTaskTitle = value => {
  const text = cleanInput(value).trim();

  if (!text) {
    return "Task Title is required.";
  }

  if (text.length < 3) {
    return "Task Title must be at least 3 characters.";
  }

  if (text.length > 300) {
    return "Task Title cannot exceed 300 characters.";
  }

  if (/\d/.test(text)) {
    return "Task Title cannot contain numbers.";
  }

  return validateMeaningfulText(
    text,
    "Task Title",
    3
  );
};

const validateTaskDescription = value => {
  const text = cleanInput(value).trim();

  if (!text) {
    return "Description is required.";
  }

  if (text.length < 8) {
    return "Description must be at least 8 characters.";
  }

  if (text.length > 1000) {
    return "Description cannot exceed 1000 characters.";
  }

  if (
    text.split(/\s+/).filter(Boolean).length < 2
  ) {
    return "Description must contain at least 2 words.";
  }

  return validateMeaningfulText(
    text,
    "Description",
    8
  );
};

const validateTaskPayload = (
  body,
  { partial = false } = {}
) => {
  const data = body || {};

  const has = key =>
    !partial ||
    Object.prototype.hasOwnProperty.call(data, key);

  if (has("taskTitle")) {
    const error = validateTaskTitle(data.taskTitle);

    if (error) {
      return {
        message: error,
        field: "taskTitle",
      };
    }
  }

  if (has("description")) {
    const error = validateTaskDescription(
      data.description
    );

    if (error) {
      return {
        message: error,
        field: "description",
      };
    }
  }

  const checks = [
    [
      "status",
      ["Todo", "In Progress", "Completed"],
      "Invalid task status.",
    ],
    [
      "priority",
      ["Low", "Medium", "High"],
      "Invalid task priority.",
    ],
    [
      "size",
      ["XS", "S", "M", "L", "XL"],
      "Invalid task size.",
    ],
  ];

  for (const [field, allowed, message] of checks) {
    if (
      has(field) &&
      !allowed.includes(data[field])
    ) {
      return {
        message,
        field,
      };
    }
  }

  if (has("deadline")) {
    if (!data.deadline) {
      return {
        message: "Deadline is required.",
        field: "deadline",
      };
    }

    // Strict YYYY-MM-DD calendar-date validation, aligned with TaskForm.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.deadline))) {
      return { message: "Deadline is invalid.", field: "deadline" };
    }

    const [year, month, day] = String(data.deadline).split("-").map(Number);
    const deadline = new Date(Date.UTC(year, month - 1, day));

    if (
      deadline.getUTCFullYear() !== year ||
      deadline.getUTCMonth() !== month - 1 ||
      deadline.getUTCDate() !== day
    ) {
      return { message: "Deadline is invalid.", field: "deadline" };
    }

    const today = new Date();
    const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    if (deadline < todayUtc) {
      return {
        message: "Deadline cannot be a past date.",
        field: "deadline",
      };
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "requiredSkills"
    )
  ) {
    if (!Array.isArray(data.requiredSkills)) {
      return {
        message: "Required skills must be an array.",
        field: "requiredSkills",
      };
    }

    const normalizedSkills = data.requiredSkills.map(skill =>
      cleanInput(skill).trim().toLowerCase()
    );

    if (new Set(normalizedSkills).size !== normalizedSkills.length) {
      return {
        message: "Duplicate required skills are not allowed.",
        field: "requiredSkills",
      };
    }

    for (const skill of data.requiredSkills) {
      const error = validateMeaningfulText(
        skill,
        "Skill",
        2
      );

      if (error) {
        return {
          message: error,
          field: "requiredSkills",
        };
      }

      if (
        cleanInput(skill).trim().length > 100
      ) {
        return {
          message:
            "Skill cannot exceed 100 characters.",
          field: "requiredSkills",
        };
      }
    }
  }

  return null;
};

// Create task
const createTask = async (req, res) => {
  try {
    const error = validateTaskPayload(req.body);

    if (error) {
      return res.status(400).json({
        status: 400,
        message: error.message,
        field: error.field,
      });
    }

    const result = await taskService.createTask(
      req.body,
      req.user.id,
      req.user.role
    );

    if (
      result.task &&
      Array.isArray(result.task.assignedTo)
    ) {
      const actor = await User.findById(req.user.id).select("fullName");
      const actorName = actor?.fullName || "Project Manager";

      for (const memberId of result.task.assignedTo) {
        await createNotification({
          recipient: memberId,
          sender: req.user.id,
          project: result.task.project,
          type: "TASK_ASSIGNED",
          title: "Task Assigned",
          message: `${actorName} assigned you the task "${result.task.taskTitle}".`,
          task: result.task._id,
        });
      }
    }

    return res.status(result.status).json(result);
  } catch (error) {
    console.error(
      "Create Task Controller Error:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// Get project tasks
const getTasksByProject = async (req, res) => {
  try {
    const projectId =
      req.params.projectId || req.params.id;

    if (!projectId) {
      return res.status(400).json({
        status: 400,
        message: "Project ID is required",
      });
    }

    const result =
      await taskService.getTasksByProject(
        projectId,
        req.user.id,
        req.user.role
      );

    return res.status(result.status).json(result);
  } catch (error) {
    console.error(
      "Get Tasks By Project Controller Error:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// Get dashboard tasks
const getDashboardTasks = async (req, res) => {
  try {
    const result =
      await taskService.getDashboardTasks(
        req.user.id,
        req.user.role,
        req.query.workspaceId
      );

    return res.status(result.status).json(result);
  } catch (error) {
    console.error(
      "Dashboard Tasks Controller Error:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// Get task insights
const getTaskInsights = async (req, res) => {
  try {
    const result =
      await taskService.getTaskInsights(
        req.user.id,
        req.user.role,
        req.query.workspaceId
      );

    return res.status(result.status).json(result);
  } catch (error) {
    console.error(
      "Task Insights Controller Error:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// Get single task
const getTaskById = async (req, res) => {
  try {
    const taskId =
      req.params.taskId || req.params.id;

    if (!taskId) {
      return res.status(400).json({
        status: 400,
        message: "Task ID is required",
      });
    }

    const result = await taskService.getTaskById(
      taskId,
      req.user.id,
      req.user.role
    );

    return res.status(result.status).json(result);
  } catch (error) {
    console.error(
      "Get Single Task Controller Error:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const taskId =
      req.params.taskId || req.params.id;

    const role = req.user.role
      ?.toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

    const error = validateTaskPayload(
      req.body,
      { partial: true }
    );

    if (error) {
      return res.status(400).json({
        status: 400,
        message: error.message,
        field: error.field,
      });
    }

    const updateData =
      role === "team-member"
        ? { status: req.body.status }
        : req.body;

    const oldTask = await Task.findById(taskId);

    if (!oldTask) {
      return res.status(404).json({
        status: 404,
        message: "Task not found",
      });
    }

    const actor = await User.findById(req.user.id).select("fullName");
    const actorName = actor?.fullName || (role === "teammember" ? "A team member" : "Project Manager");

    const result = await taskService.updateTask(
      taskId,
      updateData,
      req.user.id,
      req.user.role
    );

    if (result.task) {
      if (
        updateData.status &&
        updateData.status !== oldTask.status &&
        req.user.role?.toString().trim().toLowerCase().replace(/\s+/g, "") !== "teammember"
      ) {
        await createNotification({
          recipient: oldTask.createdBy,
          sender: req.user.id,
          project: result.task.project,
          type: "STATUS_UPDATED",
          title: "Task Status Updated",
          message: `${actorName} changed task "${oldTask.taskTitle}" status to "${updateData.status}".`,
          task: oldTask._id,
        });
      }

      if (result.memberCompletionChanged && req.body.status === "Completed") {
        const finalMember = result.task.status === "Completed";
        await createNotification({
          recipient: oldTask.createdBy,
          sender: req.user.id,
          project: result.task.project,
          type: "TASK_MEMBER_COMPLETED",
          title: finalMember ? "Task Completed" : "Task Part Completed",
          message: finalMember
            ? `${actorName} completed their part of task "${oldTask.taskTitle}". All assignees and subtasks are now complete, so the task is completed.`
            : `${actorName} completed their part of task "${oldTask.taskTitle}". The task remains open until all assignees complete their parts and all subtasks are completed.`,
          task: oldTask._id,
        });
      }

      if (Array.isArray(updateData.assignedTo)) {
        const oldIds = (
          oldTask.assignedTo || []
        ).map(id => id.toString());

        for (const memberId of updateData.assignedTo.filter(
          id => !oldIds.includes(id.toString())
        )) {
          await createNotification({
            recipient: memberId,
            sender: req.user.id,
            project: result.task.project,
            type: "TASK_ASSIGNED",
            title: "Task Assigned",
            message: `${actorName} assigned you the task "${oldTask.taskTitle}".`,
            task: oldTask._id,
          });
        }
      }
    }

    return res.status(result.status).json(result);
  } catch (error) {
    console.error(
      "Update Task Controller Error:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const taskId =
      req.params.taskId || req.params.id;

    const result = await taskService.deleteTask(
      taskId,
      req.user.id,
      req.user.role
    );

    return res.status(result.status).json(result);
  } catch (error) {
    console.error(
      "Delete Task Controller Error:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// Upload task file
const uploadTaskFile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        message:
          "Please select a valid attachment file.",
      });
    }

    const fileUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/${req.file.filename}`;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        message: "Task reference target missing.",
      });
    }

    const fileName = req.file.originalname
      .trim()
      .toLowerCase();

    if (
      task.files.some(
        file =>
          file.fileName
            ?.trim()
            .toLowerCase() === fileName
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A file with the same name already exists in this task.",
      });
    }

    if (req.user.role === "Project Admin") {
      const project = await Project.findById(
        task.project
      ).select("workspace");

      if (!project) {
        return res.status(404).json({
          message: "Project not found.",
        });
      }

      const Workspace = require(
        "../models/Workspace"
      );

      const allowed = await Workspace.findOne({
        _id: project.workspace,
        projectAdmin: req.user.id,
      }).select("_id");

      if (!allowed) {
        return res.status(403).json({
          message:
            "Access denied. This task does not belong to your workspace.",
        });
      }
    }

    task.files.push({
      fileName: req.file.originalname,
      fileUrl,
      uploadedBy: req.user.id,
    });

    await task.save();

    return res.status(200).json({
      status: 200,
      message: "File uploaded successfully",
      task,
    });
  } catch (error) {
    console.error(
      "Upload Task File Controller Error:",
      error
    );

    return res.status(500).json({
      message:
        "Server Error during file processing",
    });
  }
};

// Delete task file
const deleteTaskFile = async (req, res) => {
  try {
    const {
      id: taskId,
      fileId,
    } = req.params;

    const currentUserId =
      req.user.id || req.user._id;

    const currentUserRole = req.user.role;

    const {
      deleteMode = "everyone",
    } = req.body;

    const normalizedRole = currentUserRole
      ?.toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

    const isProjectManager =
      normalizedRole === "projectmanager";

    const isTeamMember =
      normalizedRole === "teammember";

    if (!isProjectManager && !isTeamMember) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Project Managers and Team Members can manage task files.",
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const targetFile = task.files.find(
      file =>
        file._id.toString() ===
        fileId.toString()
    );

    if (!targetFile) {
      return res.status(404).json({
        success: false,
        message:
          "File metadata not found inside database.",
      });
    }

    const isOriginalUploader =
      targetFile.uploadedBy &&
      targetFile.uploadedBy.toString() ===
        currentUserId.toString();

    // Delete only for the current user
    if (deleteMode === "me") {
      const alreadyHidden = (
        targetFile.hiddenFor || []
      ).some(
        userId =>
          userId.toString() ===
          currentUserId.toString()
      );

      if (!alreadyHidden) {
        targetFile.hiddenFor.push(
          currentUserId
        );
      }

      await task.save();

      return res.status(200).json({
        success: true,
        message: "File deleted for you.",
        deleteMode: "me",
        fileId,
      });
    }

    // Delete for everyone
    if (deleteMode === "everyone") {
      if (
        !isProjectManager &&
        !isOriginalUploader
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Team Members can only delete their own uploaded files for everyone.",
        });
      }

      task.files = task.files.filter(
        file =>
          file._id.toString() !==
          fileId.toString()
      );

      await task.save();

      return res.status(200).json({
        success: true,
        message: "File deleted for everyone.",
        deleteMode: "everyone",
        fileId,
        task,
      });
    }

    return res.status(400).json({
      success: false,
      message:
        'Invalid delete mode. Use "me" or "everyone".',
    });
  } catch (error) {
    console.error(
      "Delete Task File Controller Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error.",
    });
  }
};

const isMeaningfulSubtaskTitle = value => {
  if (
    !value ||
    value.length < 3 ||
    value.length > 120
  ) {
    return false;
  }

  const letters =
    value.match(/[A-Za-z]/g) || [];

  if (letters.length < 3) {
    return false;
  }

  const lower = letters.join("").toLowerCase();

  const uniqueRatio =
    new Set(lower).size / lower.length;

  const vowelRatio =
    (lower.match(/[aeiou]/g) || []).length /
    lower.length;

  if (uniqueRatio < 0.35) {
    return false;
  }

  if (
    lower.length >= 8 &&
    vowelRatio < 0.18
  ) {
    return false;
  }

  if (/(.)\1{4,}/.test(lower)) {
    return false;
  }

  return true;
};

// Create subtask
const createSubtask = async (req, res) => {
  try {
    const taskId = req.params.id;

    const {
      title,
      assignedTo,
    } = req.body;

    const role = req.user.role
      ?.toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

    if (role !== "projectmanager") {
      return res.status(403).json({
        message:
          "Only Project Managers can create subtasks.",
      });
    }

    const task = await Task.findById(
      taskId
    ).populate(
      "assignedTo",
      "fullName email"
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    const cleanTitle =
      typeof title === "string"
        ? title.trim()
        : "";

    if (
      !isMeaningfulSubtaskTitle(cleanTitle)
    ) {
      return res.status(400).json({
        message:
          "Please enter meaningful text for the subtask name.",
      });
    }

    if (!assignedTo) {
      return res.status(400).json({
        message:
          "Please select a subtask assignee.",
      });
    }

    const assigneeIds = (
      task.assignedTo || []
    ).map(member =>
      (member._id || member).toString()
    );

    if (
      !assigneeIds.includes(
        assignedTo.toString()
      )
    ) {
      return res.status(400).json({
        message:
          "Subtask assignee must be a member assigned to the main task.",
      });
    }

    const actor = await User.findById(req.user.id).select("fullName");
    const actorName = actor?.fullName || "Project Manager";

    task.subtasks.push({
      id: `sub-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      title: cleanTitle,
      completed: false,
      assignedTo,
      completedAt: null,
    });

    if (task.status === "Completed") {
      task.status = "In Progress";
    }

    await task.save();

    const updatedTask = await Task.findById(
      taskId
    ).populate(
      "subtasks.assignedTo",
      "fullName email"
    );

    await createNotification({
      recipient: assignedTo,
      sender: req.user.id,
      project: task.project,
      type: "SUBTASK_ASSIGNED",
      title: "Subtask Assigned",
      message: `${actorName} assigned you the subtask "${cleanTitle}" in task "${task.taskTitle}".`,
      task: task._id,
    });

    await syncProjectStatusAfterTaskChange(task.project);

    return res.status(201).json({
      message: "Subtask created successfully.",
      subtask:
        updatedTask.subtasks[
          updatedTask.subtasks.length - 1
        ],
    });
  } catch (error) {
    console.error(
      "Create Subtask Error:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// Update subtask
const updateSubtask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const subtaskId = req.params.subtaskId;

    const {
      title,
      assignedTo,
      completed,
    } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    const subtask = task.subtasks.find(
      item =>
        (item.id || item._id).toString() ===
        subtaskId.toString()
    );

    if (!subtask) {
      return res.status(404).json({
        message: "Subtask not found.",
      });
    }

    const role = req.user.role
      ?.toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

    const isManager =
      role === "projectmanager";

    const isAssignedMember =
      role === "teammember" &&
      subtask.assignedTo?.toString() ===
        req.user.id.toString();

    const actor = await User.findById(req.user.id).select("fullName");
    const actorName = actor?.fullName || (isManager ? "Project Manager" : "A team member");

    if (!isManager && !isAssignedMember) {
      return res.status(403).json({
        message:
          "You are not allowed to update this subtask.",
      });
    }

    // Team Members can only update completion
    if (!isManager) {
      if (
        typeof completed !== "boolean" ||
        Object.keys(req.body).some(
          key => key !== "completed"
        )
      ) {
        return res.status(403).json({
          message:
            "Team members can only update subtask completion.",
        });
      }

      subtask.completed = completed;
      subtask.completedAt = completed
        ? new Date()
        : null;

      if (!Array.isArray(task.assigneeCompletion) || task.assigneeCompletion.length !== (task.assignedTo || []).length) {
        task.assigneeCompletion = (task.assignedTo || []).map(member => ({
          member: normalizeUserId(member),
          completed: task.status === "Completed",
          completedAt: task.status === "Completed" ? new Date() : null,
        }));
      }

      const assigneeCompletion = task.assigneeCompletion || [];
      const allAssigneesCompleted =
        (task.assignedTo || []).length === 0 ||
        (task.assignedTo || []).every((member) => {
          const memberId = normalizeUserId(member);
          const completion = assigneeCompletion.find(
            (item) => normalizeUserId(item.member) === memberId
          );
          return completion?.completed === true;
        });
      const allSubtasksCompleted =
        (task.subtasks || []).length > 0 &&
        task.subtasks.every((item) => item.completed === true);

      if (allAssigneesCompleted && allSubtasksCompleted) {
        task.status = "Completed";
      } else if (task.status === "Completed") {
        task.status = "In Progress";
      }

      await task.save();

      if (completed) {
        await createNotification({
          recipient: task.createdBy,
          sender: req.user.id,
          project: task.project,
          type: "SUBTASK_COMPLETED",
          title: "Subtask Completed",
          message: `${actorName} completed subtask "${subtask.title}" in task "${task.taskTitle}".`,
          task: task._id,
        });
      }

      await syncProjectStatusAfterTaskChange(task.project);

      return res.status(200).json({
        message: completed
          ? "Subtask completed and Project Manager notified."
          : "Subtask marked incomplete.",
        subtask,
        taskStatus: task.status,
      });
    }

    if (title !== undefined) {
      const cleanTitle =
        typeof title === "string"
          ? title.trim()
          : "";

      if (
        !isMeaningfulSubtaskTitle(cleanTitle)
      ) {
        return res.status(400).json({
          message:
            "Please enter meaningful text for the subtask name.",
        });
      }

      subtask.title = cleanTitle;
    }

    const previousSubtaskAssignee = subtask.assignedTo?.toString() || null;

    if (assignedTo !== undefined) {
      const assigneeIds = (
        task.assignedTo || []
      ).map(member => member.toString());

      if (
        !assigneeIds.includes(
          assignedTo.toString()
        )
      ) {
        return res.status(400).json({
          message:
            "Subtask assignee must be a member assigned to the main task.",
        });
      }

      subtask.assignedTo = assignedTo;
    }

    if (typeof completed === "boolean") {
      subtask.completed = completed;

      subtask.completedAt = completed
        ? subtask.completedAt || new Date()
        : null;
    }

    await task.save();

    const updatedTask = await Task.findById(
      taskId
    ).populate(
      "subtasks.assignedTo",
      "fullName email"
    );

    const updatedSubtask =
      updatedTask.subtasks.find(
        item =>
          (item.id || item._id).toString() ===
          subtaskId.toString()
      );

    if (
      assignedTo !== undefined &&
      String(assignedTo) !== String(previousSubtaskAssignee || "")
    ) {
      await createNotification({
        recipient: assignedTo,
        sender: req.user.id,
        project: task.project,
        type: "SUBTASK_ASSIGNED",
        title: "Subtask Assigned",
        message: `${actorName} assigned you the subtask "${updatedSubtask.title}" in task "${task.taskTitle}".`,
        task: task._id,
      });
    }

    await syncProjectStatusAfterTaskChange(task.project);

    return res.status(200).json({
      message: "Subtask updated successfully.",
      subtask: updatedSubtask,
      taskStatus: task.status,
    });
  } catch (error) {
    console.error(
      "Update Subtask Error:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// Delete subtask
const deleteSubtask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const subtaskId = req.params.subtaskId;

    const role = req.user.role
      ?.toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

    if (role !== "projectmanager") {
      return res.status(403).json({
        message:
          "Only Project Managers can delete subtasks.",
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    const index = task.subtasks.findIndex(
      item =>
        (item.id || item._id).toString() ===
        subtaskId.toString()
    );

    if (index === -1) {
      return res.status(404).json({
        message: "Subtask not found.",
      });
    }

    task.subtasks.splice(index, 1);

    await task.save();

    return res.status(200).json({
      message: "Subtask deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete Subtask Error:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
    });
  }
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
  createSubtask,
  updateSubtask,
  deleteSubtask,
};