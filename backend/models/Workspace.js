const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    projectAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Fast "workspaces of this admin" lookup (dashboard, workspace list).
workspaceSchema.index({ projectAdmin: 1 });

module.exports = mongoose.model("Workspace", workspaceSchema);