const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const path = require("path");
const scoreCV = require("../utils/cvScorer");
const generateRecommendation = require("../utils/recommendationGenerator");
const Invite = require("../models/invite");
const AuditLog = require("../models/AuditLog");

const validateCVContent = (text) => {
  const normalizedText = text.replace(/\s+/g, " ").trim();

  if (!normalizedText) {
    return "The uploaded PDF does not contain readable text. Please upload a valid CV.";
  }

  if (normalizedText.length < 100) {
    return "The uploaded PDF does not contain enough information to be a valid CV.";
  }

  const indicators = [
    "education",
    "skills",
    "experience",
    "work experience",
    "projects",
    "certifications",
    "certificates",
    "qualification",
    "professional experience",
    "employment",
    "career objective",
    "objective",
    "profile",
    "summary",
    "technical skills",
  ];

  if (
    indicators.filter((item) =>
      normalizedText.toLowerCase().includes(item)
    ).length < 2
  ) {
    return "The uploaded PDF does not appear to be a CV. Please upload a valid CV.";
  }

  return null;
};

const mailer = require("../config/mailer");
const { sendMailInBackground } = mailer;
const { emitToUser } = require("../config/realtime");

const createAuditLog = async (data, label) => {
  try {
    await AuditLog.create(data);
  } catch (error) {
    console.error(`${label} Audit Log Error:`, error.message);
  }
};

const signup = async (userData, file) => {
  let totalScore = 0;
  let scoreResult = { breakdown: {} };
  let recommendation = "Pending";

  const {
    fullName,
    email,
    password,
    role,
    token,
  } = userData;

  // Validate and score Project Admin CV
  if (
    role === "Project Admin" &&
    file?.path &&
    fs.existsSync(file.path)
  ) {
    try {
      const pdfData = await pdfParse(
        fs.readFileSync(file.path)
      );

      const cvValidationError =
        validateCVContent(pdfData.text || "");

      if (cvValidationError) {
        try {
          fs.unlinkSync(file.path);
        } catch (error) {
          console.error(
            "Invalid CV cleanup error:",
            error.message
          );
        }

        return {
          status: 400,
          message: cvValidationError,
          field: "cv",
        };
      }

      scoreResult = scoreCV(pdfData.text || "");
      totalScore = scoreResult.totalScore || 0;
      recommendation =
        generateRecommendation(totalScore);
    } catch (error) {
      console.error(
        "CV Processing Error:",
        error.message
      );

      return {
        status: 500,
        message: "CV processing failed",
        error: error.message,
        field: "cv",
      };
    }
  }

  const cleanEmail =
    typeof email === "string"
      ? email.trim().toLowerCase()
      : "";

  // Validate invitation token
  let invite = null;

  if (token) {
    invite = await Invite.findOne({
      token,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (!invite) {
      return {
        status: 400,
        message: "Invalid invitation link",
      };
    }

    if (
      invite.email.toLowerCase().trim() !==
      cleanEmail
    ) {
      return {
        status: 400,
        message: "Invitation email does not match",
      };
    }
  }

  const hashedPassword =
    await bcrypt.hash(password, 10);

  const verificationToken =
    crypto.randomBytes(32).toString("hex");

  const verificationExpire =
    Date.now() + 24 * 60 * 60 * 1000;

  const userDataToSave = {
    fullName,
    email: cleanEmail,
    password: hashedPassword,
    role: invite
      ? invite.role
      : "Project Admin",
    workspace: invite
      ? invite.workspace
      : null,
    accountStatus: invite
      ? "Approved"
      : "Pending",
    isVerified: invite
      ? true
      : false,
    verificationToken: invite
      ? undefined
      : verificationToken,
    verificationTokenExpire: invite
      ? undefined
      : verificationExpire,
  };

  if (
    role === "Project Admin" &&
    file?.path
  ) {
    userDataToSave.cvFile = file.path;
    userDataToSave.cvScore = totalScore;
    userDataToSave.scoreBreakdown =
      scoreResult.breakdown;
    userDataToSave.recommendation =
      recommendation;
  }

  // Check for an existing account with this email up front so we can return
  // a clean, friendly response instead of hitting a Mongo duplicate-key
  // error on save.
  const existingUser = await User.findOne({
    email: cleanEmail,
  });

  if (existingUser) {
    return {
      status: 409,
      message: "An account with this email already exists.",
    };
  }

  const user = new User(userDataToSave);

  try {
    await user.save();
  } catch (error) {
    // Safety net for the rare race condition where two signups with the
    // same email land at the same time. Never let the raw Mongo error
    // (e.g. "E11000 duplicate key error collection...") reach the client.
    if (error.code === 11000) {
      return {
        status: 409,
        message: "An account with this email already exists.",
      };
    }
    throw error;
  }

  await createAuditLog(
    {
      user: user._id,
      workspace:
        user.workspace || null,
      action: "Created",
      module: "User",
      description: `User "${user.fullName}" was created`,
      targetId: user._id,
      targetName: user.fullName,
    },
    "User Created"
  );

  // Send verification email for normal Project Admin signup
  if (!invite) {
    const verificationUrl =
      `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    sendMailInBackground(
      {
        from: process.env.EMAIL_USER,
        to: cleanEmail,
        subject:
          "VisionPM - Verify Your Email",
        html: `
          <h2>Welcome to VisionPM, ${fullName}!</h2>
          <p>Your Project Admin account has been successfully registered.</p>
          <p>Please verify your email address before logging in.</p>
          <br />
          <a href="${verificationUrl}"
            style="display:inline-block; padding:10px 20px; background:#2563eb; color:white; text-decoration:none; border-radius:6px;">
            Verify Email
          </a>
          <p>This verification link will expire in 24 hours.</p>
          <p>Regards,
          <br />
            VisionPM Team
          </p>
        `,
      },
      { label: "Signup verification email" }
    );
  }

  if (invite) {
    invite.status = "accepted";
    await invite.save();
  }

  return {
    status: 201,
    message: "Signup Successful",
  };
};

const login = async (userData) => {

  try {

    const {
      email,
      password,
    } = userData;

    const user = await User.findOne({
      email: email?.trim().toLowerCase(),
    }).maxTimeMS(5000);

    if (!user) {
      return {
        status: 401,
        message: "Invalid credentials",
      };
    }

    // Check account lock for every user
    if (
      user.lockUntil &&
      user.lockUntil > Date.now()
    ) {
      return {
        status: 403,
        message:
          "Account temporarily locked. Please try again after 15 minutes.",
      };
    }

    // Reset expired lock
    if (
      user.lockUntil &&
      user.lockUntil <= Date.now()
    ) {
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            loginAttempts: 0,
          },
          $unset: {
            lockUntil: "",
          },
        }
      );

      user.loginAttempts = 0;
      user.lockUntil = undefined;
    }

    if (
      user.role === "Project Admin" &&
      user.accountStatus === "Pending"
    ) {
      return {
        status: 403,
        message:
          "Your account is waiting for Super Admin approval",
      };
    }

    if (
      user.role === "Project Admin" &&
      user.accountStatus === "Rejected"
    ) {
      return {
        status: 403,
        message:
          "Your account request has been rejected",
      };
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {

      const failedAttempts =
        (user.loginAttempts || 0) + 1;

      if (failedAttempts >= 3) {

        const lockUntil =
          Date.now() + 15 * 60 * 1000;

        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              loginAttempts: failedAttempts,
              lockUntil,
            },
          }
        );

        return {
          status: 403,
          message:
            "Account temporarily locked for 15 minutes after 3 failed login attempts",
        };
      }

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            loginAttempts: failedAttempts,
          },
        }
      );

      return {
        status: 401,
        message: "Invalid credentials",
      };
    }

    if (
      user.role === "Project Admin" &&
      !user.isVerified
    ) {
      return {
        status: 403,
        message:
          "Please verify your email before login",
      };
    }

    // Reset failed attempts after successful login
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          isOnline: true,
          loginAttempts: 0,
        },
        $unset: {
          lockUntil: "",
        },
      }
    );

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    await createAuditLog(
      {
        user: user._id,
        workspace:
          user.workspace || null,
        action: "Login",
        module: "Authentication",
        description: `${user.fullName} logged into VisionPM`,
        targetId: user._id,
        targetName: user.fullName,
      },
      "Login"
    );

    return {
      status: 200,
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };

  } catch (error) {

    console.error(
      "Login Error:",
      error
    );

    return {
      status: 500,
      message: "Login failed",
      error: error.message,
    };
  }
};

const getCurrentUser = async (userId) => {
  try {
    const user =
      await User.findById(userId).select(
        "-password"
      );

    if (!user) {
      return {
        status: 404,
        message: "User not found",
      };
    }

    return {
      status: 200,
      user,
    };
  } catch (error) {
    console.error(
      "Get Current User Error:",
      error.message
    );

    return {
      status: 500,
      message:
        "Failed to get current user",
    };
  }
};

const verifyEmail = async (token) => {
  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    return {
      status: 400,
      message:
        "Invalid or expired verification link",
    };
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        isVerified: true,
      },
      $unset: {
        verificationToken: "",
        verificationTokenExpire: "",
      },
    }
  );

  return {
    status: 200,
    message:
      "Email verified successfully",
  };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({
    email,
  });

  if (!user) {
    return {
      status: 404,
      message: "Email not found",
    };
  }

  const resetToken =
    crypto.randomBytes(32).toString("hex");

  const resetExpire =
    Date.now() + 60 * 60 * 1000;

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        resetPasswordToken: resetToken,
        resetPasswordExpire: resetExpire,
      },
    }
  );

  const resetUrl =
    `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  sendMailInBackground(
    {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Password Reset",
    html: `
      <h3>Password Reset</h3>
      <p>Your password reset link will expire in 1 hour.</p>
      <a href="${resetUrl}">Reset Password</a>
    `,
    },
    { label: "Password reset email" }
  );

  return {
    status: 200,
    message: "Reset link sent",
  };
};

const resetPassword = async (
  token,
  password
) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    return {
      status: 400,
      message:
        "Invalid or expired token",
    };
  }

  const hashedPassword =
    await bcrypt.hash(password, 10);

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        password: hashedPassword,
      },
      $unset: {
        resetPasswordToken: "",
        resetPasswordExpire: "",
      },
    }
  );

  return {
    status: 200,
    message:
      "Password reset successful",
  };
};

const getCVDetails = async (userId) => {
  const user =
    await User.findById(userId);

  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  if (user.role !== "Project Admin") {
    return {
      status: 403,
      message:
        "CV details are only available for Project Admin",
    };
  }

  let cvFileUrl = null;

  if (user.cvFile) {
    cvFileUrl =
      `/uploads/${path.basename(
        user.cvFile.replace(/\\/g, "/")
      )}`;
  }

  return {
    status: 200,
    fullName: user.fullName,
    email: user.email,
    cvFile: user.cvFile || null,
    cvFileUrl,
    cvScore: user.cvScore || 0,
    recommendation:
      user.recommendation || "Pending",
    scoreBreakdown:
      user.scoreBreakdown || {},
  };
};

const getPendingRequests = async () => {
  const users = await User.find({
    role: "Project Admin",
  })
    .select("-password")
    .sort({ createdAt: -1 });

  return {
    status: 200,
    users,
  };
};

const approveProjectAdmin = async (
  userId,
  adminId
) => {
  const user =
    await User.findById(userId);

  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  if (
    user.accountStatus === "Approved"
  ) {
    return {
      status: 400,
      message:
        "User is already approved",
    };
  }

  const verificationToken =
    crypto.randomBytes(32).toString("hex");

  const verificationExpire =
    Date.now() + 24 * 60 * 60 * 1000;

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        accountStatus: "Approved",
        verificationToken,
        verificationTokenExpire:
          verificationExpire,
        isVerified: false,
      },
    }
  );

  const verificationUrl =
    `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

  sendMailInBackground(
    {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject:
        "VisionPM Account Approved - Verify Your Email",
      html: `
        <h2>Congratulations ${user.fullName}!</h2>
        <p>Your Project Admin account has been approved by the Super Admin.</p>
        <p>Your account is now approved. Please verify your email address before logging in.</p>
        <br />
        <a href="${verificationUrl}" style="display:inline-block; padding:10px 20px; background:#2563eb; color:white; text-decoration:none; border-radius:6px;">
          Verify Email
        </a>
        <p>This verification link will expire in 24 hours.</p>
        <p>After verification, you can login to VisionPM.</p>
      `,
    },
    {
      label: "Approval email",
      onError: () =>
        emitToUser(adminId, "email_failed", {
          type: "approval",
          message: `${user.fullName} was approved, but the verification email to ${user.email} could not be delivered.`,
        }),
    }
  );

  return {
    status: 200,
    message:
      "Project Admin approved and verification email sent successfully",
  };
};

const rejectProjectAdmin = async (
  userId,
  adminId
) => {
  const user =
    await User.findById(userId);

  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  if (
    user.accountStatus === "Rejected"
  ) {
    return {
      status: 400,
      message:
        "User is already rejected",
    };
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        accountStatus: "Rejected",
      },
    }
  );

  sendMailInBackground(
    {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject:
        "VisionPM Account Request Update",
      html: `
        <h3>Hello ${user.fullName}</h3>
        <p>We regret to inform you that your Project Admin account request has been rejected.</p>
        <p>If you believe this decision was made in error, please contact the VisionPM administrator.</p>
        <br />
        <p>Regards,</p>
        <p>VisionPM Team</p>
      `,
    },
    {
      label: "Rejection email",
      onError: () =>
        emitToUser(adminId, "email_failed", {
          type: "rejection",
          message: `${user.fullName} was rejected, but the notification email to ${user.email} could not be delivered.`,
        }),
    }
  );

  return {
    status: 200,
    message:
      "Project Admin rejected successfully",
  };
};

const logout = async (userId) => {
  const user =
    await User.findById(userId);

  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        isOnline: false,
      },
    }
  );

  await createAuditLog(
    {
      user: user._id,
      workspace:
        user.workspace || null,
      action: "Logout",
      module: "Authentication",
      description: `${user.fullName} logged out of VisionPM`,
      targetId: user._id,
      targetName: user.fullName,
    },
    "Logout"
  );

  return {
    status: 200,
    message: "Logout successful",
  };
};

module.exports = {
  signup,
  login,
  logout,
  getCurrentUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getPendingRequests,
  approveProjectAdmin,
  rejectProjectAdmin,
  getCVDetails,
};