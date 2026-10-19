const cron = require("node-cron");
const Task = require("../models/Task");
const { createNotification } = require("../utils/notify");

// Check tasks with deadlines within 24 hours
const checkDeadlines = async () => {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await Task.find({
      deadline: { $gte: now, $lte: in24Hours },
      status: { $ne: "Completed" },
      deadlineReminderSent: { $ne: true },
    });

    // Notify all assigned members
    for (const task of tasks) {
      for (const memberId of task.assignedTo) {
        await createNotification({
          recipient: memberId,
          type: "DEADLINE",
          title: task.taskTitle,
          message: `Task "${task.taskTitle}" deadline is within 24 hours.`,
          task: task._id,
        });
      }

      task.deadlineReminderSent = true;
      await task.save();
    }

    if (tasks.length)
      console.log(`Deadline reminders processed: ${tasks.length}`);
  } catch (error) {
    console.error("Deadline Reminder Cron Error:", error);
  }
};

// Run deadline check every hour
const startDeadlineReminderJob = () => {
  cron.schedule("0 * * * *", checkDeadlines);
  console.log("Deadline reminder cron job scheduled");
};

module.exports = { startDeadlineReminderJob };