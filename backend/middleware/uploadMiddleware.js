const multer = require("multer");
const path = require("path");

// Configure file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

// Validate uploaded files
const fileFilter = (req, file, cb) => {


  const extension = path.extname(file.originalname).toLowerCase();
  const isSignupRequest =
    req.originalUrl?.includes("/auth") ||
    req.originalUrl?.includes("/signup");

  // Allow PDF only for CV uploads
  if (isSignupRequest) {
    return extension === ".pdf" && file.mimetype === "application/pdf"
      ? cb(null, true)
      : cb(new Error("Only PDF files are allowed for CV upload."), false);
  }

  // Allow supported task attachments
  const allowedExtensions = [
    ".pdf", ".docx", ".xlsx", ".jpg",
    ".jpeg", ".png", ".zip", ".rar",
  ];

  if (!allowedExtensions.includes(extension)) {
    return cb(
      new Error("Only PDF, DOCX, XLSX, JPG, PNG, ZIP, and RAR files are allowed."),
      false
    );
  }

  cb(null, true);
};

// Configure upload limits
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;