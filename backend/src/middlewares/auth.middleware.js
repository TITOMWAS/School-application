const jwt = require("jsonwebtoken");
const env = require("../config/env");
const userService = require("../modules/users/user.service");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, env.jwt.secret);

    const user = await userService.getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated.",
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired.",
      });
    }
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication error.",
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.jwt.secret);
    const user = await userService.getUserById(decoded.id);
    
    if (user && user.is_active) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    next();
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }
  next();
};

const isTeacher = (req, res, next) => {
  if (!req.user || req.user.role !== "teacher") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Teacher only.",
    });
  }
  next();
};

const isParent = (req, res, next) => {
  if (!req.user || req.user.role !== "parent") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Parent only.",
    });
  }
  next();
};

const isAdminOrTeacher = (req, res, next) => {
  if (!req.user || !["admin", "teacher"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin or Teacher only.",
    });
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  isAdmin,
  isTeacher,
  isParent,
  isAdminOrTeacher,
};

