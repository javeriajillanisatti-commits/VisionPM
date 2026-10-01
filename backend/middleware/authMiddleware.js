const jwt = require("jsonwebtoken");

// Protect routes with JWT authentication
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader)
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });

    if (!authHeader.startsWith("Bearer "))
      return res.status(401).json({
        message: "Invalid authorization format",
      });

    const token = authHeader.substring(7).trim();

    if (!token)
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });

    if (token.split(".").length !== 3)
      return res.status(401).json({
        message: "Invalid token format",
      });

    if (!process.env.JWT_SECRET)
      return res.status(500).json({
        message: "Server authentication configuration error",
      });

    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    console.error("Auth Protect Error:", error.message);

    if (error.name === "TokenExpiredError")
      return res.status(401).json({
        message: "Token expired",
      });

    if (error.name === "JsonWebTokenError")
      return res.status(401).json({
        message: "Invalid token",
      });

    return res.status(401).json({
      message: "Authentication failed",
    });
  }
};

// Normalize role names for comparison
const normalizeRole = role =>
  role
    ? role.toString().trim().toLowerCase().replace(/[\s_-]+/g, "")
    : "";

// Authorize users by role
const authorize = (...roles) => (req, res, next) => {
 if (!req.user || !req.user.role)
    return res.status(403).json({
      message: "Access denied",
    });

  const userRole = normalizeRole(req.user.role);
  const allowedRoles = roles.map(normalizeRole);

  if (!allowedRoles.includes(userRole))
    return res.status(403).json({
      message: "Access denied",
    });

  next();
};

module.exports = {
  protect,
  authorize,
};