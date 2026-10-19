const AuditLog = require("../models/AuditLog");
const Workspace = require("../models/Workspace");

// Get Audit Logs
const getAuditLogs = async (req, res) => {
  try {
    console.log("🔥 GET AUDIT LOGS HIT");
    console.log("🔥 AUDIT USER:", req.user);

    let filter = {};

    // Filter Project Admin logs by their workspaces
    if (req.user?.role === "Project Admin") {
      console.log("🔥 USER IS PROJECT ADMIN");

      const adminId = req.user.id;
      console.log("🔥 PROJECT ADMIN ID:", adminId);

      const adminWorkspaces = await Workspace.find({
        projectAdmin: adminId,
      }).select("_id");

      console.log("🔥 ADMIN WORKSPACES:", adminWorkspaces);

      const workspaceIds = adminWorkspaces.map(({ _id }) => _id);
      console.log("🔥 WORKSPACE IDS FOR AUDIT:", workspaceIds);

      filter.workspace = { $in: workspaceIds };
      filter.user = { $ne: adminId };
    }

    // Fetch audit logs
    console.log("🔥 FINAL AUDIT FILTER:", filter);

    let logs = await AuditLog.find(filter)
      .populate("user", "fullName email role")
      .populate("workspace", "name workspaceName")
      .sort({ createdAt: -1 });

    // Keep only Project Manager and Team Member activities
    if (req.user?.role === "Project Admin") {
      logs = logs.filter(
        ({ user }) =>
          user &&
          ["Project Manager", "Team Member"].includes(user.role)
      );
    }

    console.log("🔥 AUDIT LOGS FOUND:", logs.length);
    if (logs.length) console.log("🔥 FIRST AUDIT LOG:", logs[0]);

    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error("❌ Get Audit Logs Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};

// Create Audit Log
const createAuditLog = async (req, res) => {
  try {
    const {
      action,
      module,
      description,
      targetId,
      targetName,
      workspace,
      ipAddress,
    } = req.body;

    // Get logged-in user's ID
    const userId = req.user?.id;
    console.log("🔥 CREATE AUDIT LOG USER ID:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Check Project Admin workspace access
    if (req.user.role === "Project Admin" && workspace) {
      const userWorkspace = await Workspace.findOne({
        _id: workspace,
        projectAdmin: userId,
      });

      if (!userWorkspace) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to create audit logs for this workspace",
        });
      }
    }

    // Prevent duplicate logs for the same action
    const existingLog = await AuditLog.findOne({
      user: userId,
      workspace: workspace || null,
      action,
      targetId: targetId || null,
    });

    if (existingLog) {
      console.log("⚠️ DUPLICATE AUDIT LOG SKIPPED:", existingLog._id);

      return res.status(200).json({
        success: true,
        message: "Audit log already exists",
        log: existingLog,
      });
    }

    // Create audit log
    const auditLog = await AuditLog.create({
      user: userId,
      workspace: workspace || null,
      action,
      module,
      description,
      targetId: targetId || null,
      targetName: targetName || "",
      ipAddress: ipAddress || req.ip || "",
    });

    console.log("✅ AUDIT LOG CREATED:", auditLog._id);

    return res.status(201).json({
      success: true,
      message: "Audit log created successfully",
      log: auditLog,
    });
  } catch (error) {
    console.error("❌ Create Audit Log Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create audit log",
    });
  }
};

// Export controller functions
module.exports = {
  getAuditLogs,
  createAuditLog,
};