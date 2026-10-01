const Notification = require("../models/Notification");

const createNotification = async (data) => {
  try {
    const {
      recipient,
      type,
      title,
      message,
      task,
      project,
      sender,
      announcement,
      attachmentName,
      attachmentUrl,
    } = data;

    if (!recipient) {
      console.error("Create Notification Error: recipient missing");
      return null;
    }

    const titleMap = {
      TASK_ASSIGNED: "Task Assigned",
      SUBTASK_ASSIGNED: "Subtask Assigned",
      SUBTASK_COMPLETED: "Subtask Completed",
      TASK_MEMBER_COMPLETED: "Task Part Completed",
      STATUS_UPDATED: "Task Status Updated",
      DEADLINE: "Deadline Reminder",
      ANNOUNCEMENT: "Announcement",
    };

    const notification = await Notification.create({
      recipient,
      type,
      title: title || titleMap[type] || "Notification",
      message,
      task,
      project,
      sender,
      announcement,
      attachmentName,
      attachmentUrl,
    });

    console.log(`Notification created for ${recipient}: ${message}`);
    return notification;
  } catch (error) {
    console.error("Create Notification Error:", error.message);
    return null;
  }
};

module.exports = { createNotification };