const Notification = require("../models/Notification");

// Get my notifications
const getMyNotifications = async (req, res) => {
  try {
    const filter = {
      recipient: req.user.id,
    };

    const notifications = await Notification.find(filter)
      .populate(
        "project",
        "projectName title workspaceId projectManager createdBy"
      )
      .populate(
        "task",
        "taskTitle status priority deadline project assignedTo"
      )
      .populate(
        "sender",
        "fullName email role"
      )
      .populate(
        "announcement",
        "workspaceId title message attachmentName attachmentUrl createdBy createdByName createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Mark one notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user.id,
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Mark As Read Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user.id,
        isRead: false,
      },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark All As Read Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};