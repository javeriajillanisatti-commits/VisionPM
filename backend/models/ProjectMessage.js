const mongoose = require("mongoose");

const projectMessageSchema = new mongoose.Schema(
  {
    // Project linked with the discussion message
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    // User who sent the message
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Discussion message content
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    // Reactions added by project members
    reactions: [
      {
        emoji: {
          type: String,
          required: true,
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],

    // Track message editing
    edited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    // Store users who deleted the message for themselves
    hiddenFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Optimize project discussion message queries
projectMessageSchema.index({ project: 1, createdAt: 1 });

module.exports = mongoose.model("ProjectMessage", projectMessageSchema);