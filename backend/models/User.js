const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Basic account information
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // User role controls system permissions
    role: {
      type: String,
      enum: [
        "Super Admin",
        "Project Admin",
        "Project Manager",
        "Team Member",
      ],
      default: "Project Admin",
    },

    // Profile picture path
    profilePic: {
      type: String,
      default: "",
    },

    // Team member information
    skills: {
      type: [String],
      default: undefined,
    },

    workload: {
      type: Number,
      default: undefined,
    },

    availability: {
      type: String,
      default: undefined,
    },

    // Workspace assigned to the user
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: undefined,
    },

    // Authentication and account verification
    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationToken: {
      type: String,
      default: undefined,
    },

    verificationTokenExpire: {
      type: Date,
      default: undefined,
    },

    // Login security and account locking
    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    // Password reset information
    resetPasswordToken: {
      type: String,
      default: undefined,
    },

    resetPasswordExpire: {
      type: Date,
      default: undefined,
    },

    // Track user's current online status
    isOnline: {
      type: Boolean,
      default: false,
    },

    // Admin approval status
    accountStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    // Project Admin CV information
    cvFile: {
      type: String,
      default: undefined,
    },

    cvScore: {
      type: Number,
      default: undefined,
    },

    recommendation: {
      type: String,
      default: undefined,
    },

    // CV score breakdown
    scoreBreakdown: {
      education: {
        type: Number,
        default: undefined,
      },
      skills: {
        type: Number,
        default: undefined,
      },
      projects: {
        type: Number,
        default: undefined,
      },
      experience: {
        type: Number,
        default: undefined,
      },
      certifications: {
        type: Number,
        default: undefined,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Apply fields according to the user's role
userSchema.pre("save", function () {
  if (this.role !== "Team Member") {
    this.skills = undefined;
    this.workload = undefined;
    this.availability = undefined;
  } else {
    if (this.skills === undefined) this.skills = [];
    if (this.workload === undefined) this.workload = 0;
    if (this.availability === undefined) this.availability = "Available";
  }

  if (!this.workspace) this.workspace = undefined;

  // CV data is only stored for Project Admins
  if (this.role !== "Project Admin") {
    this.cvFile = undefined;
    this.cvScore = undefined;
    this.recommendation = undefined;
    this.scoreBreakdown = undefined;
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;