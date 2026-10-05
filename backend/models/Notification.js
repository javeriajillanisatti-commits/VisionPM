const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // User who receives the notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Notification event type
    type: {
      type: String,
      enum: [
        "TASK_ASSIGNED",
        "SUBTASK_ASSIGNED",
        "SUBTASK_COMPLETED",
        "TASK_MEMBER_COMPLETED",
        "STATUS_UPDATED",
        "DEADLINE",
        "ANNOUNCEMENT",
      ],
      required: true,
    },

    // Short title shown in the notification list
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Full notification message
    message: {
      type: String,
      required: true,
      trim: true,
    },

    // User who triggered the notification (PM / Team Member / Admin)
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Related project for project notifications
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },

    // Related task for task-based notifications
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },

    // Related announcement for announcement notifications
    announcement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Announcement",
    },

    // Optional announcement attachment details
    attachmentName: String,
    attachmentUrl: String,

    // Track whether the notification has been read
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);