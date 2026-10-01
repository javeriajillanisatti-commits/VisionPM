const Announcement = require("../models/Announcement");
const Project = require("../models/Project");
const Workspace = require("../models/Workspace");
const User = require("../models/User");
const { createNotification } = require("../utils/notify");

const TITLE_MIN_CHARS = 3;
const TITLE_MAX_CHARS = 300;
const MESSAGE_MIN_CHARS = 8;
const MESSAGE_MIN_WORDS = 2;
const MESSAGE_MAX_WORDS = 1000;

const GARBAGE_PATTERNS = [
  "asdf", "fdsa", "qwer", "qwerty", "zxcv", "xcvz",
  "asdfgh", "qwertyui", "poiuy", "lkjhg", "hjkl",
];

const INJECTION_PATTERNS = [
  "$where", "$ne", "$gt", "$gte", "$lt", "$lte",
  "$regex", "$or", "$and", "$in", "$nin", "$exists",
  "$elemMatch", "$not", "$nor", "javascript:", "<script",
  "</script", "<iframe", "</iframe", "<object", "</object",
  "<embed", "onerror", "onload", "onclick", "onmouseover",
  "eval(", "alert(",
];

const cleanText = (value = "") =>
  String(value)
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");

const getCompactText = text => cleanText(text).toLowerCase().replace(/\s/g, "");

const countWords = text => {
  const trimmed = cleanText(text).trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
};

const hasGarbagePattern = text => {
  const compact = getCompactText(text);
  return GARBAGE_PATTERNS.some(pattern => compact.includes(pattern));
};

const hasRepeatingPattern = text => {
  const compact = getCompactText(text);
  if (compact.length < 6) return false;

  for (let size = 1; size <= Math.floor(compact.length / 2); size++) {
    if (compact.length % size !== 0) continue;

    const pattern = compact.slice(0, size);
    const repetitions = compact.length / size;

    if (repetitions >= 3 && pattern.repeat(repetitions) === compact) {
      return true;
    }
  }

  return false;
};

const hasRepeatedCharacter = text => {
  const compact = getCompactText(text);
  return compact.length > 0 && /^(.)\1+$/.test(compact);
};

const hasExcessiveCharacterRepetition = text => {
  const compact = getCompactText(text);
  if (compact.length < 6) return false;

  const frequency = {};
  for (const character of compact) {
    frequency[character] = (frequency[character] || 0) + 1;
  }

  const maxFrequency = Math.max(...Object.values(frequency), 0);
  return maxFrequency / compact.length >= 0.8;
};

const hasOnlyNumbers = text => /^\d+$/.test(cleanText(text).trim());

const hasOnlySymbols = text => {
  const clean = cleanText(text).trim();
  return clean.length > 0 && !/[\p{L}]/u.test(clean) && !/\d/.test(clean);
};

const hasHtmlOrScript = text => /<\s*\/?\s*[a-z][^>]*>/i.test(text);

const hasInjectionPattern = text => {
  const lowerText = cleanText(text).toLowerCase();
  return INJECTION_PATTERNS.some(pattern =>
    lowerText.includes(pattern.toLowerCase())
  );
};

const hasSuspiciousJson = text => {
  const trimmed = cleanText(text).trim();

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    return true;
  }

  return /["']?\$[a-zA-Z_][\w$]*["']?\s*:\s*/.test(trimmed);
};

const hasInvalidBoundaryCharacters = text => {
  const trimmed = cleanText(text).trim();

  return (
    /^[-,']/.test(trimmed) ||
    /[-,']$/.test(trimmed) ||
    /--/.test(trimmed) ||
    /,,/.test(trimmed) ||
    /''/.test(trimmed)
  );
};

const hasMultipleSpaces = text => /\s{2,}/.test(cleanText(text));

const hasStandaloneSpecialCharacters = text => {
  const trimmed = cleanText(text).trim();
  return trimmed.length > 0 && /^[-,']+$/.test(trimmed);
};

const hasDuplicateWords = text => {
  const words = cleanText(text)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  return new Set(words).size !== words.length;
};

const isMeaninglessText = text => {
  const clean = cleanText(text).trim();

  if (!clean || !/[\p{L}\p{N}]/u.test(clean)) return true;
  if (hasOnlyNumbers(clean) || hasOnlySymbols(clean)) return true;
  if (hasRepeatedCharacter(clean)) return true;
  if (hasGarbagePattern(clean)) return true;
  if (hasRepeatingPattern(clean)) return true;
  if (hasExcessiveCharacterRepetition(clean)) return true;

  return false;
};

const validateAnnouncementText = (text, type) => {
  const clean = cleanText(text).trim();

  if (!clean) return type === "title" ? "Title is required" : "Message is required";

  if (type === "title" && clean.length < TITLE_MIN_CHARS) {
    return `Title must be at least ${TITLE_MIN_CHARS} characters`;
  }

  if (type === "title" && clean.length > TITLE_MAX_CHARS) {
    return `Title cannot exceed ${TITLE_MAX_CHARS} characters`;
  }

  if (type === "message" && clean.length < MESSAGE_MIN_CHARS) {
    return `Message must be at least ${MESSAGE_MIN_CHARS} characters`;
  }

  if (hasHtmlOrScript(clean)) return "HTML or script content is not allowed";
  if (hasInjectionPattern(clean)) return "Invalid or unsafe input detected";
  if (hasSuspiciousJson(clean)) return "JSON or object-style input is not allowed";
  if (hasMultipleSpaces(clean)) return "Multiple consecutive spaces are not allowed";
  if (hasInvalidBoundaryCharacters(clean)) {
    return "Invalid special characters or character placement";
  }
  if (hasStandaloneSpecialCharacters(clean)) return "Please enter meaningful text";
  if (hasOnlyNumbers(clean)) return "Numbers-only input is not allowed";
  if (hasOnlySymbols(clean)) return "Symbols-only input is not allowed";
  if (isMeaninglessText(clean)) {
    return "Please enter meaningful text, not random or repeated characters";
  }
  if (hasDuplicateWords(clean)) return "Duplicate words are not allowed";

  return "";
};

// Create announcement
const createAnnouncement = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, message } = req.body;
    const cleanedTitle = cleanText(title).trim();
    const cleanedMessage = cleanText(message).trim();

    const titleError = validateAnnouncementText(cleanedTitle, "title");
    if (titleError) {
      return res.status(400).json({ success: false, message: titleError });
    }

    const messageError = validateAnnouncementText(cleanedMessage, "message");
    if (messageError) {
      return res.status(400).json({ success: false, message: messageError });
    }

    const messageWords = countWords(cleanedMessage);
    if (messageWords < MESSAGE_MIN_WORDS) {
      return res.status(400).json({
        success: false,
        message: `Message must be at least ${MESSAGE_MIN_WORDS} words`,
      });
    }

    if (messageWords > MESSAGE_MAX_WORDS) {
      return res.status(400).json({
        success: false,
        message: `Message cannot exceed ${MESSAGE_MAX_WORDS} words`,
      });
    }

    const workspace = await Workspace.findById(workspaceId).select("projectAdmin");
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const createdBy = req.user?._id || req.user?.id || req.user?.userId;
    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication data not found",
      });
    }

    const currentUser = await User.findById(createdBy).select(
      "fullName name username email"
    );

    const createdByName =
      currentUser?.fullName ||
      currentUser?.name ||
      currentUser?.username ||
      currentUser?.email ||
      "Admin";

    const attachmentName = req.file?.originalname || "";
    const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : "";

    const announcement = await Announcement.create({
      workspaceId,
      title: cleanedTitle,
      message: cleanedMessage,
      createdBy,
      createdByName,
      attachmentName,
      attachmentUrl,
    });

    const projects = await Project.find({
      workspace: workspaceId,
    }).select("members createdBy");

    // Build unique announcement recipients
    const recipientIds = new Set();

    if (workspace.projectAdmin) {
      recipientIds.add(String(workspace.projectAdmin));
    }

    projects.forEach(project => {
      if (project.createdBy) recipientIds.add(String(project.createdBy));

      (project.members || []).forEach(memberId => {
        if (memberId) recipientIds.add(String(memberId));
      });
    });

    console.log("ANNOUNCEMENT RECIPIENTS:", Array.from(recipientIds));

    for (const recipient of recipientIds) {
      await createNotification({
        recipient,
        type: "ANNOUNCEMENT",
        title: cleanedTitle,
        message: cleanedMessage,
        announcement: announcement._id,
        attachmentName,
        attachmentUrl,
      });
    }

    return res.status(201).json({
      success: true,
      announcement,
    });
  } catch (error) {
    console.error("Create Announcement Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create announcement",
    });
  }
};

// Get announcements
const getAnnouncements = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const announcements = await Announcement.find({ workspaceId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      announcements,
    });
  } catch (error) {
    console.error("Get Announcements Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
    });
  }
};

// Delete announcement
const deleteAnnouncement = async (req, res) => {
  try {
    const { workspaceId, id } = req.params;

    const announcement = await Announcement.findOneAndDelete({
      _id: id,
      workspaceId,
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Delete Announcement Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete announcement",
    });
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
};