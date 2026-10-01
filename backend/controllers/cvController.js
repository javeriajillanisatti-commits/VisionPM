const User = require("../models/User");
const calculateCVScore = require("../utils/cvScorer");
const generateRecommendation = require("../utils/recommendationGenerator");

// Upload and score CV
exports.uploadCV = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "Project Admin") {
      return res.status(403).json({
        message: "Only Project Admin can upload CV",
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a PDF" });
    }

    const cvPath = req.file.path;
    const score = calculateCVScore(req.file.filename);
    const recommendation = generateRecommendation(score);

    user.cvPath = cvPath;
    user.cvScore = score;
    user.recommendation = recommendation;

    await user.save();

    return res.status(200).json({
      success: true,
      cvPath,
      score,
      recommendation,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};