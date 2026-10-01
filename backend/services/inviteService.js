const crypto = require("crypto");
const Invite = require("../models/invite");
const User = require("../models/User");
const Workspace = require("../models/Workspace");
const Project = require("../models/Project");
const { sendMailInBackground } = require("../config/mailer");
const { emitToUser } = require("../config/realtime");

// Send workspace or project invitation
const sendInvite = async (inviteData, currentUser) => {
  const {
    email,
    role,
    workspaceId,
    projectId,
  } = inviteData;

  if (!email || !role || !workspaceId) {
    throw new Error(
      "Email, role and workspace are required"
    );
  }

  const cleanEmail = email.toLowerCase().trim();

  if (
    currentUser.role !== "Project Admin" &&
    currentUser.role !== "Project Manager"
  ) {
    throw new Error(
      "You are not allowed to send invitations"
    );
  }

  if (
    currentUser.role === "Project Manager" &&
    role !== "Team Member"
  ) {
    throw new Error(
      "Project Manager can only invite Team Members"
    );
  }

  const workspace = await Workspace.findById(
    workspaceId
  );

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const currentUserId =
    currentUser.id || currentUser._id;

  // Check workspace access
  const isAdmin =
    workspace.projectAdmin &&
    workspace.projectAdmin.toString() ===
      currentUserId.toString();

  let hasWorkspaceAccess = isAdmin;

  if (currentUser.role === "Project Manager") {
    const manager = await User.findOne({
      _id: currentUserId,
      workspace: workspaceId,
      role: "Project Manager",
    });

    hasWorkspaceAccess = !!manager;
  }

  if (!hasWorkspaceAccess) {
    throw new Error(
      "You do not have access to this workspace"
    );
  }

  let project = null;

  // Validate project invitation
  if (projectId) {
    project = await Project.findOne({
      _id: projectId,
      workspace: workspaceId,
    });

    if (!project) {
      throw new Error(
        "Project not found in this workspace"
      );
    }

    if (role === "Project Manager") {
      if (currentUser.role !== "Project Admin") {
        throw new Error(
          "Only the Project Admin can invite a Project Manager"
        );
      }
    } else if (role !== "Team Member") {
      throw new Error(
        "Invalid role for project invitation"
      );
    }
  }

  const existingUser = await User.findOne({
    email: cleanEmail,
  });

  if (existingUser) {
    throw new Error(
      "This email is already registered"
    );
  }

  const existingInvite = await Invite.findOne({
    email: cleanEmail,
    workspace: workspaceId,
    status: "pending",
  });

  if (existingInvite) {
    throw new Error(
      "A pending invitation already exists for this email"
    );
  }

  const token = crypto
    .randomBytes(32)
    .toString("hex");

  const invite = await Invite.create({
    email: cleanEmail,
    role,
    workspace: workspaceId,
    project: projectId || null,
    invitedBy: currentUserId,
    token,
    expiresAt: new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ),
  });
  
  const frontendUrl =
    process.env.FRONTEND_URL ||
    "http://localhost:3000";

  const inviteLink =
    `${frontendUrl}/signup?token=${token}` +
    `&email=${encodeURIComponent(cleanEmail)}` +
    `&role=${encodeURIComponent(role)}`;

  sendMailInBackground(
    {
      from: process.env.EMAIL_USER,
      to: cleanEmail,
      subject: `Invitation to join ${workspace.name}`,
      html: `
        <div>
          <h2>VisionPM Workspace Invitation</h2>

          <p>
            You have been invited to join
            <strong>${workspace.name}</strong>.
          </p>

          <p>
            Your role is <strong>${role}</strong>.
          </p>

          ${
            project && role === "Project Manager"
              ? `
                <p>
                  You have been invited to manage the project
                  <strong>${project.projectName}</strong>.
                </p>
              `
              : ""
          }

          ${
            project &&
            role === "Team Member"
              ? `
                <p>
                  You will join the project
                  <strong>${project.projectName}</strong>
                  as a Team Member.
                </p>
              `
              : ""
          }

          <p>
            <a href="${inviteLink}">
              Accept Invitation
            </a>
          </p>

          <p>
            This invitation expires in 24 hours.
          </p>
        </div>
      `,
    },
    {
      label: "Invitation email",
      onError: async () => {
        await Invite.deleteOne({ _id: invite._id });
        emitToUser(currentUserId, "email_failed", {
          type: "invite",
          message: `Invitation email to ${cleanEmail} could not be delivered. Please check the address and invite again.`,
        });
      },
    }
  );

  return invite;
};

// Verify invitation token
const verifyInviteToken = async (
  token,
  email
) => {
  if (!token || !email) {
    throw new Error(
      "Invitation token and email are required"
    );
  }

  const invite = await Invite.findOne({
    token,
    email: email.toLowerCase().trim(),
    status: "pending",
  });

  if (!invite) {
    throw new Error(
      "Invalid or expired invitation"
    );
  }

  if (invite.expiresAt < new Date()) {
    throw new Error(
      "Invitation has expired"
    );
  }

  return invite;
};

module.exports = {
  sendInvite,
  verifyInviteToken,
};