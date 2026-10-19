const Project = require("../models/Project");
const ProjectMessage = require("../models/ProjectMessage");

const isProjectManagerCreator = (project, user) =>
  user?.role === "Project Manager" &&
  String(project.createdBy?._id || project.createdBy) === String(user.id);

const isProjectMember = (project, userId) =>
  (project.members || []).some(
    (member) => String(member?._id || member) === String(userId)
  );

const canAccessDiscussion = (project, user) =>
  isProjectManagerCreator(project, user) || isProjectMember(project, user.id);

const getProjectForAccess = async (projectId) =>
  Project.findById(projectId).select("projectName createdBy members");

// Get project discussion
const getProjectDiscussion = async (req, res) => {
  try {
    const project = await getProjectForAccess(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!canAccessDiscussion(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project's discussion.",
      });
    }

    const messages = await ProjectMessage.find({
      project: project._id,
      hiddenFor: { $ne: req.user.id },
    })
      .sort({ createdAt: 1 })
      .limit(300)
      .populate("sender", "fullName email role profilePic isOnline");

    return res.status(200).json({
      success: true,
      messages,
      canModerate: isProjectManagerCreator(project, req.user),

    });
  } catch (error) {
    console.error("Get project discussion error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  getProjectDiscussion,
  getProjectForAccess,
  canAccessDiscussion,
  isProjectManagerCreator,
};