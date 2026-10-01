const inviteService = require("../services/inviteService");
const formatErrorMessage = require("../utils/formatErrorMessage");

// Send an invite
const sendInvite = async (req, res) => {
  try {
    const invite = await inviteService.sendInvite(
      req.body,
      req.user
    );

    return res.status(201).json({
      status: 201,
      success: true,
      message: "Invitation sent successfully",
      invite,
    });
  } catch (error) {
    console.error("Send Invite Error:", error);

    return res.status(400).json({
      status: 400,
      success: false,
      message: formatErrorMessage(error),
    });
  }
};

// Verify the invitation token
const verifyInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const email = req.query.email;

    const invite =
      await inviteService.verifyInviteToken(
        token,
        email
      );

    return res.status(200).json({
      status: 200,
      success: true,
      invite,
    });
  } catch (error) {
    console.error(
      "Verify Invite Error:",
      error
    );

    return res.status(400).json({
      status: 400,
      success: false,
      message: formatErrorMessage(error),
    });
  }
};

module.exports = {
  sendInvite,
  verifyInvite,
};