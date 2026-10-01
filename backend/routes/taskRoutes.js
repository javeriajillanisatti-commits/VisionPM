const express = require("express");

const router = express.Router();

const taskController = require("../controllers/taskController");

const { protect } = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

// Task routes

router.post(
  "/",
  protect,
  taskController.createTask
);

router.get(
  "/",
  protect,
  taskController.getDashboardTasks
);

router.get(
  "/insights",
  protect,
  taskController.getTaskInsights
);

router.get(
  "/project/:id",
  protect,
  taskController.getTasksByProject
);


router.get(
  "/:id",
  protect,
  taskController.getTaskById
);

router.put(
  "/:id",
  protect,
  taskController.updateTask
);
// Subtask routes

router.post(
  "/:id/subtasks",
  protect,
  taskController.createSubtask
);

router.put(
  "/:id/subtasks/:subtaskId",
  protect,
  taskController.updateSubtask
);

router.delete(
  "/:id/subtasks/:subtaskId",
  protect,
  taskController.deleteSubtask
);

// Delete task

router.delete(
  "/:id",
  protect,
  taskController.deleteTask
);

// Task file attachments

router.put(
  "/:id/upload",
  protect,
  upload.single("file"),
  taskController.uploadTaskFile
);

router.delete(
  "/:id/file/:fileId",
  protect,
  taskController.deleteTaskFile
);

module.exports = router;