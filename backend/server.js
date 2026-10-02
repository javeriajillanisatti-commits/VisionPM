const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const Comment = require("./models/Comment");
const Project = require("./models/Project");
const ProjectMessage = require("./models/ProjectMessage");
const User = require("./models/User");
const jwt = require("jsonwebtoken");

const {
  canAccessDiscussion,
  isProjectManagerCreator,
} = require("./controllers/projectDiscussionController");

const memberRoutes = require("./routes/memberRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const resourceAllocationRoutes = require("./routes/resourceallocationRoutes");
const delayPredictionRoutes = require("./routes/delayPredictionRoutes");
const auditRoutes = require("./routes/auditRoutes");
const workPlanRoutes = require("./routes/workPlanRoutes");
const contributionRoutes = require("./routes/contributionRoutes");
const projectDiscussionRoutes = require("./routes/projectDiscussionRoutes");
const contactRoutes = require("./routes/contactRoutes");
const invitationRoutes = require("./routes/inviteRoutes");
const authRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const profileRoutes = require("./routes/profileRoutes");
const commentRoutes = require("./routes/commentRoutes");
const { startDeadlineReminderJob } = require("./cronJobs/deadlineReminder");


const connectDB = require("./config/db");
connectDB();
//require("./config/mailer").warmUp();

const app = express();

const allowedOrigin =
  process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.use("/api/invites", invitationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/project-discussions", projectDiscussionRoutes);
app.use("/api/member", memberRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/resource-allocation", resourceAllocationRoutes);
app.use("/api/delay-prediction", delayPredictionRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/member/workplan", workPlanRoutes);
app.use("/api/member/contribution", contributionRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});
require("./config/realtime").setIO(io);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.userId = decoded.id;
    socket.userRole = decoded.role;

    next();
  } catch (error) {
    console.error("Socket authentication failed:", error.message);
    next(new Error("Invalid authentication token"));
  }
});

io.on("connection", async socket => {
  // Personal room so we can push private messages (e.g. "email failed") to this user
  socket.join(`user:${socket.userId}`);

  try {
    await User.updateOne(
      { _id: socket.userId },
      { $set: { isOnline: true } }
    );

    console.log("🟢 USER ACTIVE:", socket.userId.toString());

    io.emit("userStatusChanged", {
      userId: socket.userId.toString(),
      isOnline: true,
    });
  } catch (error) {
    console.error("❌ Failed to set user active:", error.message);
  }

  // Project discussion access and message handling
  const getDiscussionProject = async projectId => {
    if (!projectId) return null;

    return Project.findById(projectId).select(
      "projectName createdBy members"
    );
  };

  const authorizeProjectDiscussion = async projectId => {
    const project = await getDiscussionProject(projectId);

    if (!project) {
      return {
        project: null,
        allowed: false,
        moderator: false,
      };
    }

    const user = {
      id: socket.userId,
      role: socket.userRole,
    };

    return {
      project,
      allowed: canAccessDiscussion(project, user),
      moderator: isProjectManagerCreator(project, user),
    };
  };

  socket.on("join_project_discussion", async ({ projectId }) => {
    try {
      const { project, allowed } =
        await authorizeProjectDiscussion(projectId);

      if (!project || !allowed) {
        socket.emit("project_discussion_access_denied", {
          message:
            "You are not a member of this project's discussion.",
        });
        return;
      }

      const room = `project:${projectId}`;
      socket.join(room);
      socket.emit("project_discussion_joined", { projectId });

    } catch (error) {
      console.error("Project discussion join error:", error);
      socket.emit("project_discussion_error", {
        message: "Unable to join project discussion.",
      });
    }
  });

  socket.on("leave_project_discussion", ({ projectId }) => {
    if (!projectId) return;

    const room = `project:${projectId}`;
    socket.leave(room);

  });

  socket.on("send_project_message", async ({ projectId, message }) => {
    try {
      const cleanMessage = message?.trim();
      const { project, allowed } =
        await authorizeProjectDiscussion(projectId);

      if (!project || !allowed) {
        socket.emit("project_discussion_access_denied", {
          message: "You cannot post in this discussion.",
        });
        return;
      }

      if (!cleanMessage || cleanMessage.length > 5000) return;

      let created = await ProjectMessage.create({
        project: projectId,
        sender: socket.userId,
        message: cleanMessage,
        reactions: [],
      });

      created = await ProjectMessage.findById(created._id).populate(
        "sender",
        "fullName email role profilePic isOnline"
      );

      io.to(`project:${projectId}`).emit(
        "project_message_received",
        created
      );
    } catch (error) {
      console.error("Project discussion send error:", error);
      socket.emit("project_discussion_error", {
        message: "Unable to send message.",
      });
    }
  });

  socket.on(
    "edit_project_message",
    async ({ projectId, messageId, message }) => {
      try {
        const cleanMessage = message?.trim();

        if (!cleanMessage || cleanMessage.length > 5000) return;

        const { project, allowed, moderator } =
          await authorizeProjectDiscussion(projectId);

        if (!project || !allowed) return;

        const existing = await ProjectMessage.findOne({
          _id: messageId,
          project: projectId,
        });

        if (!existing) return;

        if (String(existing.sender) !== String(socket.userId)) {
          socket.emit("project_discussion_error", {
            message: "You can only edit your own messages.",
          });
          return;
        }

        if (
          !moderator &&
          String(existing.sender) !== String(socket.userId)
        ) {
          return;
        }

        existing.message = cleanMessage;
        existing.edited = true;
        existing.editedAt = new Date();

        await existing.save();

        io.to(`project:${projectId}`).emit(
          "project_message_updated",
          {
            messageId: existing._id,
            message: existing.message,
            editedAt: existing.editedAt,
          }
        );
      } catch (error) {
        console.error("Project discussion edit error:", error);
        socket.emit("project_discussion_error", {
          message: "Unable to edit message.",
        });
      }
    }
  );

  socket.on(
    "delete_project_message",
    async ({ projectId, messageId, mode = "everyone" }) => {
      try {
        const { project, allowed, moderator } =
          await authorizeProjectDiscussion(projectId);

        if (!project || !allowed) return;

        const existing = await ProjectMessage.findOne({
          _id: messageId,
          project: projectId,
        });

        if (!existing) return;

        const isOwner =
          String(existing.sender) === String(socket.userId);

        if (mode === "me") {
          if (!isOwner && !moderator) {
            socket.emit("project_discussion_error", {
              message:
                "You can only delete your own message for yourself.",
            });
            return;
          }

          await ProjectMessage.updateOne(
            { _id: messageId, project: projectId },
            { $addToSet: { hiddenFor: socket.userId } }
          );

          socket.emit("project_message_hidden_for_me", {
            messageId,
          });

          return;
        }

        if (!isOwner && !moderator) {
          socket.emit("project_discussion_error", {
            message:
              "You are not allowed to delete this message for everyone.",
          });
          return;
        }

        await ProjectMessage.deleteOne({ _id: messageId });

        io.to(`project:${projectId}`).emit(
          "project_message_deleted",
          { messageId }
        );
      } catch (error) {
        console.error("Project discussion delete error:", error);
        socket.emit("project_discussion_error", {
          message: "Unable to delete message.",
        });
      }
    }
  );

  socket.on(
    "toggle_project_reaction",
    async ({ projectId, messageId, emoji }) => {
      try {
        const { project, allowed } =
          await authorizeProjectDiscussion(projectId);

        if (!project || !allowed || !emoji) return;

        const existing = await ProjectMessage.findOne({
          _id: messageId,
          project: projectId,
        });

        if (!existing) return;

        const index = existing.reactions.findIndex(
          reaction =>
            reaction.emoji === emoji &&
            String(reaction.userId) === String(socket.userId)
        );

        if (index >= 0) {
          existing.reactions.splice(index, 1);
        } else {
          existing.reactions.push({
            emoji,
            userId: socket.userId,
          });
        }

        await existing.save();

        io.to(`project:${projectId}`).emit(
          "project_reaction_updated",
          {
            messageId,
            reactions: existing.reactions,
          }
        );
      } catch (error) {
        console.error("Project discussion reaction error:", error);
        socket.emit("project_discussion_error", {
          message: "Unable to update reaction.",
        });
      }
    }
  );

  socket.on("project_typing", async ({ projectId, isTyping }) => {
    try {
      const { project, allowed } =
        await authorizeProjectDiscussion(projectId);

      if (!project || !allowed) return;

      const sender = await User.findById(socket.userId).select(
        "fullName"
      );

      socket.to(`project:${projectId}`).emit(
        "project_user_typing",
        {
          userId: socket.userId.toString(),
          fullName: sender?.fullName || "Someone",
          isTyping: Boolean(isTyping),
        }
      );
    } catch (error) {
      console.error("Project discussion typing error:", error);
    }
  });

  // Task chat access for Project Manager and assigned Team Members
  const getTaskCommentAccess = async taskId => {
    if (!taskId) {
      return {
        task: null,
        project: null,
        allowed: false,
        isPM: false,
        isAssignedTM: false,
      };
    }

    const task = await require("./models/Task")
      .findById(taskId)
      .select("project createdBy assignedTo");

    if (!task) {
      return {
        task: null,
        project: null,
        allowed: false,
        isPM: false,
        isAssignedTM: false,
      };
    }

    const project = await Project.findById(task.project).select(
      "createdBy members"
    );

    if (!project) {
      return {
        task,
        project: null,
        allowed: false,
        isPM: false,
        isAssignedTM: false,
      };
    }

    const role =
      socket.userRole?.toString().toLowerCase().replace(/[\s\_-]+/g, "") ||
      "";

    const currentUserId = String(socket.userId);

    const isPM =
      role === "projectmanager" &&
      String(project.createdBy) === currentUserId;

    const isAssignedTM = (task.assignedTo || []).some(
      id => String(id) === currentUserId
    );

    return {
      task,
      project,
      allowed: isPM || isAssignedTM,
      isPM,
      isAssignedTM,
    };
  };

  const authorizeCommentAction = async (commentId, taskId) => {
    const access = await getTaskCommentAccess(taskId);

    if (!access.allowed) {
      return {
        ...access,
        comment: null,
        commentAllowed: false,
      };
    }

    const comment = await Comment.findById(commentId);

    if (!comment || String(comment.task) !== String(taskId)) {
      return {
        ...access,
        comment: null,
        commentAllowed: false,
      };
    }

    return {
      ...access,
      comment,
      commentAllowed: true,
      isOwner: String(comment.sender) === String(socket.userId),
    };
  };

  socket.on("join_task_chat", async ({ taskId }) => {
    try {
      const access = await getTaskCommentAccess(taskId);

      if (!access.allowed) {
        socket.emit("task_chat_access_denied", {
          message:
            "Only the Project Manager and assigned Team Members can access these task comments.",
        });
        return;
      }

      socket.join(String(taskId));
    } catch (error) {
      console.error("Task chat join error:", error);
      socket.emit("task_chat_access_denied", {
        message: "Unable to access task comments.",
      });
    }
  });

  socket.on("send_message", async ({ taskId, message }) => {
    try {
      const access = await getTaskCommentAccess(taskId);
      const cleanMessage = message?.trim();

      if (
        !access.allowed ||
        !cleanMessage ||
        cleanMessage.length > 5000
      ) {
        return;
      }

      let comment = await Comment.create({
        task: taskId,
        sender: socket.userId,
        message: cleanMessage,
        hiddenFor: [],
        reactions: [],
      });

      comment = await Comment.findById(comment._id).populate(
        "sender",
        "fullName email role profilePic"
      );

      io.to(String(taskId)).emit("receive_message", comment);
    } catch (err) {
      console.error("Socket send comment error:", err);
    }
  });

  socket.on(
    "toggle_reaction",
    async ({ commentId, taskId, emoji }) => {
      try {
        const access = await authorizeCommentAction(
          commentId,
          taskId
        );

        if (!access.commentAllowed || !emoji) return;

        const existingReactionIndex =
          access.comment.reactions.findIndex(
            reaction =>
              reaction.emoji === emoji &&
              String(reaction.userId) === String(socket.userId)
          );

        if (existingReactionIndex > -1) {
          access.comment.reactions.splice(
            existingReactionIndex,
            1
          );
        } else {
          access.comment.reactions.push({
            emoji,
            userId: socket.userId,
          });
        }

        await access.comment.save();

        io.to(String(taskId)).emit("reaction_updated", {
          commentId,
          reactions: access.comment.reactions,
        });
      } catch (err) {
        console.error("Socket reaction error:", err);
      }
    }
  );

  socket.on(
    "delete_message",
    async ({ commentId, taskId, mode = "everyone" }) => {
      try {
        const access = await authorizeCommentAction(
          commentId,
          taskId
        );

        if (!access.commentAllowed) return;

        const owner = access.isOwner;
        const canDeleteEveryone = owner || access.isPM;

        if (mode === "me") {
          if (!owner) return;

          await Comment.updateOne(
            { _id: commentId, task: taskId },
            { $addToSet: { hiddenFor: socket.userId } }
          );

          socket.emit("message_hidden_for_me", {
            commentId,
          });

          return;
        }

        if (!canDeleteEveryone) return;

        await Comment.findByIdAndDelete(commentId);

        io.to(String(taskId)).emit("message_deleted", {
          commentId,
        });
      } catch (err) {
        console.error("Socket delete comment error:", err);
      }
    }
  );

  socket.on(
    "edit_message",
    async ({ commentId, taskId, newMessage }) => {
      try {
        const cleanMessage = newMessage?.trim();
        const access = await authorizeCommentAction(
          commentId,
          taskId
        );

        if (
          !access.commentAllowed ||
          !access.isOwner ||
          !cleanMessage ||
          cleanMessage.length > 5000
        ) {
          return;
        }

        const updatedComment =
          await Comment.findByIdAndUpdate(
            commentId,
            {
              message: cleanMessage,
              isEdited: true,
            },
            { new: true }
          ).populate(
            "sender",
            "fullName email role profilePic"
          );

        if (updatedComment) {
          io.to(String(taskId)).emit("message_edited", {
            commentId,
            message: updatedComment.message,
            editedAt: updatedComment.updatedAt,
          });
        }
      } catch (err) {
        console.error("Socket comment editing error:", err);
      }
    }
  );

  socket.on("disconnect", async () => {
    try {
      await User.updateOne(
        { _id: socket.userId },
        { $set: { isOnline: false } }
      );

      console.log("🔴 USER INACTIVE:", socket.userId.toString());

      io.emit("userStatusChanged", {
        userId: socket.userId.toString(),
        isOnline: false,
      });
    } catch (error) {
      console.error(
        "Failed to set user inactive:",
        error.message
      );
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  startDeadlineReminderJob();
});