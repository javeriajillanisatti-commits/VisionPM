const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    taskTitle: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 300,
    },

    description: {
      type: String,
      default: "",
      minlength: 8,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["Todo", "In Progress", "Completed"],
      default: "Todo",
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    size: {
      type: String,
      enum: ["XS", "S", "M", "L", "XL"],
      default: "M",
    },

    deadline: {
      type: Date,
      default: null,
    },

    requiredSkills: [
      {
        type: String,
        trim: true,
        minlength: 2,
        maxlength: 100,
      },
    ],

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Per-member allocation of the task's total workload points.
    assigneeWorkloads: [
      {
        member: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        workload: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    // Tracks completion independently for each assignee.
    assigneeCompletion: [
      {
        member: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: {
          type: Date,
          default: null,
        },
      },
    ],

    // Subtasks
    subtasks: [
      {
        id: {
          type: String,
          required: true,
        },
        title: {
          type: String,
          required: true,
          trim: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        completedAt: {
          type: Date,
          default: null,
        },
      },
    ],

    // Task files
    files: [
      {
        fileName: {
          type: String,
          required: true,
        },
        fileUrl: {
          type: String,
          required: true,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        hiddenFor: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Task progress
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ML delay prediction fields
    // Workload value used by the ML model
    workload: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Time remaining until the deadline
    time_left: {
      type: Number,
      default: 0,
    },

    // Delay prediction result
    delay_prediction: {
      type: String,
      default: null,
    },

    // Prevent sending the same deadline reminder again
    deadlineReminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate task titles within the same project, ignoring case.
taskSchema.index(
  { project: 1, taskTitle: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

// Supports the live member-workload query used by profiles, reports, workspace dashboards and resource allocation.
taskSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model("Task", taskSchema);