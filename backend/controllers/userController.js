const userService = require("../services/userService");

const getUsers = async (req, res) => {
  try {
    const result = await userService.getUsers(req.query, req.user);

    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

const getUserQuickView = async (req, res) => {
  try {
    const result = await userService.getUserQuickView(
      req.params.userId,
      req.user
    );

    res.status(result.status).json(result);
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

module.exports = {
  getUsers,
  getUserQuickView,
};