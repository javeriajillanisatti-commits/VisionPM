const express = require("express");
const axios = require("axios");

const router = express.Router();

// Use environment URL for deployment, with local fallback
const FLASK_URL =
  process.env.ML_SERVICE_URL || "http://127.0.0.1:5001";

// Predict delay for a single task
router.post("/predict", async (req, res) => {
  try {
    const { priority, workload, progress, time_left } = req.body;

    const response = await axios.post(`${FLASK_URL}/predict`, {
      priority: priority || "Medium",
      workload: workload !== undefined ? workload : 0,
      progress: progress !== undefined ? progress : 0,
      time_left: time_left !== undefined ? time_left : 0,
    });

    return res.json({
      success: true,
      ...response.data,
    });
  } catch (error) {
    console.error("Delay Prediction Error:", error.message);

    if (error.response)
      console.error("ML Service Response:", error.response.data);

    return res.status(500).json({
      success: false,
      message: "Unable to get delay prediction",
    });
  }
});

// Predict delay for multiple tasks
router.post("/predict-batch", async (req, res) => {
  try {
    const { tasks } = req.body;

    // Validate batch input
    if (!Array.isArray(tasks))
      return res.status(400).json({
        success: false,
        message: "Tasks must be provided as an array",
      });

    if (!tasks.length)
      return res.json({
        success: true,
        totalTasks: 0,
        results: [],
      });

    const response = await axios.post(`${FLASK_URL}/predict-batch`, {
      tasks,
    });

    return res.json({
      success: true,
      totalTasks: response.data.totalTasks,
      results: response.data.results,
    });
  } catch (error) {
    console.error("Batch Delay Prediction Error:", error.message);

    if (error.response)
      console.error("ML Service Response:", error.response.data);

    return res.status(500).json({
      success: false,
      message: "Unable to get batch delay predictions",
    });
  }
});

module.exports = router;