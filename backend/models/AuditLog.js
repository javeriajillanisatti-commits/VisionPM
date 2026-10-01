const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // User who performed action
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Workspace for isolation
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },

    // Action
    action: {
      type: String,
      required: true,
      enum: [
        "Created",
        "Updated",
        "Deleted",
        "Login",
        "Logout",
        "Viewed",
      ],
    },

    // Module
    module: {
      type: String,
      required: true,
      enum: [
        "User",
        "Workspace",
        "Project",
        "Task",
        "Authentication",
        "Report",
      ],
    },

    // Activity Description
    description: {
      type: String,
      required: true,
    },

    // Target Record
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    targetName: {
      type: String,
      default: "",
    },

    // IP Address
    ipAddress: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);