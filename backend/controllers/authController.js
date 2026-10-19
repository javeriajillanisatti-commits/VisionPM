const authService = require("../services/authService");
const formatErrorMessage = require("../utils/formatErrorMessage");

// Signup
const signup = async (req, res) => {
  try {
    const result = await authService.signup(req.body, req.file);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: formatErrorMessage(error) });
  }
};

// Login
const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: formatErrorMessage(error) });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const result = await authService.logout(req.user.id);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: formatErrorMessage(error) });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const result = await authService.getCurrentUser(req.user.id);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: formatErrorMessage(error) });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const result = await authService.verifyEmail(req.params.token);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: formatErrorMessage(error) });
  }
};

// Get pending requests
const pendingRequests = async (req, res) => {
  try {
    const result = await authService.getPendingRequests();
    return res.status(result.status).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: formatErrorMessage(error) });
  }
};

// Approve project admin
const approveProjectAdmin = async (req, res) => {
  const result = await authService.approveProjectAdmin(req.params.id, req.user?.id);
  return res.status(result.status).json(result);
};

// Reject project admin
const rejectProjectAdmin = async (req, res) => {
  const result = await authService.rejectProjectAdmin(req.params.id, req.user?.id);
  return res.status(result.status).json(result);
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: formatErrorMessage(error) });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const result = await authService.resetPassword(
      req.params.token,
      req.body.password
    );
    return res.status(result.status).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: formatErrorMessage(error) });
  }
};

// Get CV details
const getCVDetails = async (req, res) => {
  try {
    const result = await authService.getCVDetails(req.params.id);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: formatErrorMessage(error) });
  }
};

module.exports = {
  signup,
  login,
  logout,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  pendingRequests,
  approveProjectAdmin,
  rejectProjectAdmin,
  getCVDetails,
};