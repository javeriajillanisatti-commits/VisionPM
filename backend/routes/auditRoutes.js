const express = require("express");

const {
  getAuditLogs,
  createAuditLog,
} = require("../controllers/auditController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Get all audit logs
router.get("/", protect, getAuditLogs);

// Create audit log
router.post("/", protect, createAuditLog);

module.exports = router;