const express = require("express");
const router = express.Router();

const {
  createContactMessage,
  getAllMessages,
  markMessageAsRead,
  deleteMessage,
  replyToMessage,
} = require("../controllers/contactController");

// Submit a contact message
router.post("/", createContactMessage);

// Super Admin message management
router.get("/", getAllMessages);
router.patch("/:id/read", markMessageAsRead);
router.delete("/:id", deleteMessage);
router.post("/:id/reply", replyToMessage);

module.exports = router;