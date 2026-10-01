const User = require("../models/User");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { calculateWorkloadForMember } = require("../utils/workloadCalculator");

const uploadDir = path.join(__dirname, "..", "uploads", "profile");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(
      null,
      `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`
    ),
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const KEYBOARD_PATTERNS = [
  "qwerty", "qwertyuiop", "asdf", "asdfgh", "asdfghjkl",
  "zxcv", "zxcvbn", "zxcvbnm", "qazwsx", "wasd",
  "poiuy", "lkjh", "mnbv", "qwe", "asd", "zxc",
];

const validateName = (rawName) => {
  const name = rawName?.trim() || "";
  const nameRegex = /^[A-Za-z]+(?:[\s'-][A-Za-z]+)*$/;

  if (!name) return "Full Name is required";
  if (name.length < 3) return "Full Name must be at least 3 characters";
  if (name.length > 50) return "Full Name cannot exceed 50 characters";
  if (/\s{2,}/.test(name))
    return "Full Name cannot contain multiple consecutive spaces";
  if (/[-']{2,}/.test(name))
    return "Full Name cannot contain consecutive hyphens or apostrophes";
  if (!nameRegex.test(name))
    return "Full Name can contain only letters, spaces, hyphen or apostrophe";
  if (/^['-]|['-]$/.test(name))
    return "Full Name cannot start or end with hyphen or apostrophe";
  if (/(.)\1{2,}/.test(name))
    return "Full Name looks invalid (repeated characters)";
  if (/^([a-zA-Z]{1,3})\1{2,}$/i.test(name.replace(/\s/g, "")))
    return "Full Name looks invalid (repeating pattern)";

  const words = name.toLowerCase().split(/\s+/);

  if (words.some((word, index) => words.indexOf(word) !== index))
    return "Full Name cannot have repeated words";

  if (
    words.some((word) =>
      KEYBOARD_PATTERNS.some((pattern) => word.includes(pattern))
    )
  ) {
    return "Full Name looks invalid (keyboard pattern detected)";
  }

  return null;
};

// Get profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.id }).select("-password");
    console.log("PROFILE USER ID:", req.user.id);
console.log("PROFILE DB USER:", user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const cleanRole = user.role?.toString().trim().toLowerCase().replace(/\s+/g, "-");
    const profileData = {
      name: user.fullName,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic,
    };

    if (cleanRole === "team-member") {
      const computed = await calculateWorkloadForMember(user._id);
      profileData.skills = user.skills || [];
      profileData.workload = computed.workload;
      profileData.availability = computed.availability;
    }

    return res.json({ success: true, user: profileData });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify current password
const verifyCurrentPassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { currentPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is required",
      });
    }

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Current password verified",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const cleanRole = user.role?.toString().trim().toLowerCase().replace(/\s+/g, "-");

    if (req.body.name !== undefined) {
      const nameError = validateName(req.body.name);
      if (nameError) {
        return res.status(400).json({
          success: false,
          message: nameError,
        });
      }
    }

    user.fullName = req.body.name?.trim() || user.fullName;
    user.email = req.body.email || user.email;
    user.profilePic = req.body.profilePic || user.profilePic;

    if (cleanRole === "team-member" && req.body.skills !== undefined) {
      const skills = Array.isArray(req.body.skills)
        ? req.body.skills
        : req.body.skills.split(/[\n,]+/);

      const cleanedSkills = skills
        .map((skill) => (skill ?? "").toString().trim())
        .filter(Boolean);

      const uniqueSkills = [];
      const seenSkills = new Set();

      for (const skill of cleanedSkills) {
        const normalized = skill.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!normalized || seenSkills.has(normalized)) continue;
        seenSkills.add(normalized);
        uniqueSkills.push(skill);
      }

      if (uniqueSkills.join("\n").length > 200) {
        return res.status(400).json({
          success: false,
          message: "Skills cannot exceed 200 characters",
        });
      }

      user.skills = uniqueSkills;
    }

    if (req.body.password) {
      if (!req.body.currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required",
        });
      }

      if (!(await bcrypt.compare(req.body.currentPassword, user.password))) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      user.password = await bcrypt.hash(req.body.password, 10);
    }

    await user.save();

    const responseUser = {
      name: user.fullName,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic,
    };

    if (cleanRole === "team-member") {
      const computed = await calculateWorkloadForMember(user._id);
      responseUser.skills = user.skills || [];
      responseUser.workload = computed.workload;
      responseUser.availability = computed.availability;
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: responseUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Upload profile picture
const uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const filePath = `/uploads/profile/${req.file.filename}`;
    user.profilePic = filePath;
    await user.save();

    return res.json({
      success: true,
      profilePic: filePath,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  verifyCurrentPassword,
  uploadProfilePic,
  upload,
};