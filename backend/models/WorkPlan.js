const mongoose = require("mongoose");

const workPlanSchema = new mongoose.Schema(
  {
    // Team member who owns the schedule entry
    teamMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Reference to the scheduled task
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    // Scheduled date stored as YYYY-MM-DD to avoid timezone issues
    date: {
      type: String,
      required: true,
    },

    // Schedule start time in 24-hour format
    startTime: {
      type: String,
      required: true,
    },

    // Schedule end time in 24-hour format
    endTime: {
      type: String,
      required: true,
    },

    // Optional note for the scheduled work
    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WorkPlan", workPlanSchema);