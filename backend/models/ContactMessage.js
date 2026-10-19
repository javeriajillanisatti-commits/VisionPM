const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    message: String,

    // Track whether the message has been read
    isRead: {
      type: Boolean,
      default: false,
    },

    // Store replies sent by the Super Admin
    replies: [
      {
        message: {
          type: String,
          required: true,
          trim: true,
          minlength: 5,
          maxlength: 1000,
        },

        // Store when the reply was sent
        repliedAt: {
          type: Date,
          default: Date.now,
        },

        // Store the user or role that sent the reply
        repliedBy: {
          type: String,
          default: "Super Admin",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ContactMessage", contactMessageSchema);