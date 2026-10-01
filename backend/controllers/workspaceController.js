const workspaceService = require("../services/workspaceService");
const Workspace = require("../models/Workspace");

// Clean and validate input
const cleanInput = (value) =>
  typeof value === "string"
    ? value.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    : "";

const hasHtmlOrScript = (value) => /<[^>]*>|<\s*\/?\s*script|javascript:/i.test(value);
const hasSuspiciousInjection = (value) =>
  /\$where|\$ne|\$gt|\$gte|\$lt|\$lte|\$regex|\$exists|\$or|\$and|\$expr|\$function/i.test(value) ||
  /^or$/i.test(value.trim()) || /javascript:/i.test(value);
const hasSuspiciousObjectPattern = (value) => /^\s*[\{\[].*[\}\]]\s*$/s.test(value);
const isOnlyRepeatedCharacter = (value) => {
  const compact = value.replace(/\s/g, "");
  return !!compact && compact.length >= 4 && /^(.)(?:\1)+$/u.test(compact);
};
const isOnlyNumbers = (value) => /^\d+$/.test(value.trim());
const isOnlySymbols = (value) => /^[^\p{L}\p{N}]+$/u.test(value.trim());
const hasConsecutiveSpaces = (value) => /\s{2,}/.test(value);
const hasConsecutiveSpecialChars = (value) => /[-',]{2,}/.test(value);
const startsOrEndsWithSpecialChar = (value) => /^[-',]|[-',]$/u.test(value.trim());
const hasInvalidStandaloneSpecial = (value) => /^[-,']+$/.test(value.trim());

const hasDuplicateWord = (value) => {
  const words = value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return words.length > 1 && new Set(words).size !== words.length;
};

const hasRepeatedWordSequence = (value) => {
  const words = value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  for (let size = 1; size <= Math.floor(words.length / 2); size++)
    for (let i = 0; i + size * 2 <= words.length; i++)
      if (words.slice(i, i + size).join(" ") === words.slice(i + size, i + size * 2).join(" ")) return true;
  return false;
};

const hasRepeatingPattern = (value) => {
  const compact = value.replace(/\s/g, "").toLowerCase();
  for (let size = 1; size <= Math.floor(compact.length / 2); size++) {
    if (compact.length % size) continue;
    if (compact.slice(0, size).repeat(compact.length / size) === compact) return true;
  }
  return false;
};

const hasMinimumWords = (value, minimum) =>
  value.trim().split(/\s+/).filter(Boolean).length < minimum;

const hasGarbagePattern = (value) => {
  const normalized = value.toLowerCase().replace(/[^a-z]/g, "");
  return ["asdf", "asdfgh", "qwerty", "qwertyui", "zxcv", "zxcvbn", "poiuy", "lkjhg", "mnbvc", "hjkl"]
    .some((pattern) => normalized.includes(pattern));
};

const hasMostlySameCharacter = (value) => {
  const compact = value.replace(/\s/g, "").toLowerCase();
  if (compact.length < 5) return false;
  const counts = {};
  for (const char of compact) counts[char] = (counts[char] || 0) + 1;
  return Math.max(...Object.values(counts)) / compact.length >= 0.8;
};

const validateMeaningfulText = (value, minimumLength) => {
  const text = value.trim();
  const checks = [
    [!text, "This field is required."],
    [text.length < minimumLength, `Must be at least ${minimumLength} characters.`],
    [isOnlyNumbers(text), "Only numbers are not allowed."],
    [isOnlySymbols(text), "Only symbols are not allowed."],
    [isOnlyRepeatedCharacter(text), "Repeated single characters are not allowed."],
    [hasGarbagePattern(text), "Please enter meaningful text."],
    [hasRepeatingPattern(text), "Repeating patterns are not allowed."],
    [hasConsecutiveSpaces(text), "Multiple consecutive spaces are not allowed."],
    [hasConsecutiveSpecialChars(text), "Consecutive special characters are not allowed."],
    [startsOrEndsWithSpecialChar(text), "Text cannot start or end with -, , or '."],
    [hasInvalidStandaloneSpecial(text), "Invalid special character input."],
    [hasDuplicateWord(text), "Duplicate words are not allowed."],
    [hasRepeatedWordSequence(text), "Repeated word sequences are not allowed."],
    [hasMostlySameCharacter(text), "Text contains too many repeated characters."],
    [hasHtmlOrScript(text), "HTML or script input is not allowed."],
    [hasSuspiciousInjection(text), "Invalid or suspicious input detected."],
    [hasSuspiciousObjectPattern(text), "Object-style input is not allowed."],
  ];
  return checks.find(([invalid]) => invalid)?.[1] || null;
};

const validateWorkspaceName = (value) => {
  const text = cleanInput(value).trim();
  if (!text) return "Workspace name is required.";
  if (text.length < 3) return "Workspace name must be at least 3 characters.";
  if (text.length > 300) return "Workspace name cannot exceed 300 characters.";
  if (/\d/.test(text)) return "Workspace name cannot contain numbers.";
  return validateMeaningfulText(text, 3);
};

const validateDescription = (value) => {
  const text = cleanInput(value).trim();
  if (!text) return "Description is required.";
  if (text.length < 8) return "Description must be at least 8 characters.";
  if (text.length > 1000) return "Description cannot exceed 1000 characters.";
  if (hasMinimumWords(text, 2)) return "Description must contain at least 2 words.";
  return validateMeaningfulText(text, 8);
};

const normalizeWorkspaceName = (value) =>
  cleanInput(value).trim().replace(/\s+/g, " ").toLowerCase();

const checkDuplicateWorkspaceName = async (name, workspaceId = null) => {
  const normalizedName = normalizeWorkspaceName(name);
  const escapedName = normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const query = { name: { $regex: `^${escapedName}$`, $options: "i" } };
  if (workspaceId) query._id = { $ne: workspaceId };
  return !!(await Workspace.findOne(query).select("_id name"));
};

// Create Workspace
const createWorkspace = async (req, res) => {
  try {
    const name = cleanInput(req.body.name).trim();
    const description = cleanInput(req.body.description).trim();
    const nameError = validateWorkspaceName(name);
    const descriptionError = validateDescription(description);

    if (nameError) return res.status(400).json({ message: nameError });
    if (descriptionError) return res.status(400).json({ message: descriptionError });
    if (await checkDuplicateWorkspaceName(name)) {
      return res.status(409).json({ message: "Workspace name already exists." });
    }

    const result = await workspaceService.createWorkspace(
      { ...req.body, name, description },
      req.user.id
    );
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Create Workspace Controller Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Get All Workspaces
const getAllWorkspaces = async (req, res) => {
  try {
    const result = await workspaceService.getAllWorkspaces(
      req.user.id,
      req.user.role,
      req.query.workspaceId
    );
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Get All Workspaces Controller Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Get Workspace By ID
const getWorkspaceById = async (req, res) => {
  try {
    const result = await workspaceService.getWorkspaceById(
      req.params.id,
      req.user.id,
      req.user.role
    );
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Get Workspace By ID Controller Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Update Workspace
const updateWorkspace = async (req, res) => {
  try {
    const name = cleanInput(req.body.name).trim();
    const description = cleanInput(req.body.description).trim();
    const nameError = validateWorkspaceName(name);
    const descriptionError = validateDescription(description);

    if (nameError) return res.status(400).json({ message: nameError });
    if (descriptionError) return res.status(400).json({ message: descriptionError });
    if (await checkDuplicateWorkspaceName(name, req.params.id)) {
      return res.status(409).json({ message: "Workspace name already exists." });
    }

    const result = await workspaceService.updateWorkspace(
      req.params.id,
      { ...req.body, name, description },
      req.user.id
    );
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Update Workspace Controller Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Delete Workspace
const deleteWorkspace = async (req, res) => {
  try {
    const result = await workspaceService.deleteWorkspace(req.params.id, req.user.id);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Delete Workspace Controller Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Monitor Workspace Projects & Tasks
const getWorkspaceMonitorData = async (req, res) => {
  try {
    const workspaceId = req.params.id || req.params.workspaceId;
    if (!workspaceId) {
      return res.status(400).json({ message: "Workspace ID parameter is required." });
    }

    const result = await workspaceService.getWorkspaceMonitorData(
      workspaceId,
      req.user.id,
      req.user.role
    );
    return res.status(result.status).json(result.monitorData);
  } catch (error) {
    console.error("Workspace Monitor Controller Error:", error);
    return res.status(500).json({
      status: 500,
      message: error.message || "Internal Server Error during analytics fetch",
    });
  }
};

// Get Workspace Members With Projects
const getWorkspaceMembersWithProjects = async (req, res) => {
  try {
    const workspaceId = req.params.id || req.params.workspaceId;
    if (!workspaceId) return res.status(400).json({ message: "Workspace ID is required." });

    const result = await workspaceService.getWorkspaceMembersWithProjects(
      workspaceId,
      req.user.id,
      req.user.role
    );
    return res.status(result.status).json(result.membersData);
  } catch (error) {
    console.error("Workspace Members Project Controller Error:", error);
    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

// Get Workspace Project Map
const getWorkspaceProjectMap = async (req, res) => {
  try {
    const workspaceId = req.params.id || req.params.workspaceId;
    if (!workspaceId) return res.status(400).json({ message: "Workspace ID is required." });

    const result = await workspaceService.getWorkspaceProjectMap(
      workspaceId,
      req.user.id,
      req.user.role
    );
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Workspace Project Map Controller Error:", error);
    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

// Project Health Scanner
const getProjectHealth = async (req, res) => {
  try {
    const workspaceId = req.params.id || req.params.workspaceId;
    if (!workspaceId) return res.status(400).json({ message: "Workspace ID is required." });

    const result = await workspaceService.getProjectHealth(
      workspaceId,
      req.user.id,
      req.user.role
    );
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Project Health Scanner Controller Error:", error);
    return res.status(500).json({
      message: error.message || "Internal Server Error while scanning project health",
    });
  }
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