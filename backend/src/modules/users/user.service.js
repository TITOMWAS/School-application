const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const userSql = require("./user.sql");
const ApiError = require("../../utils/ApiError");
const env = require("../../config/env");

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwt.refreshSecret);
};

const register = async (userData) => {
  const { email, password, role, firstName, lastName, phone } = userData;

  const existingUser = await userSql.findUserByEmail(email);
  if (existingUser) {
    throw new ApiError(400, "Email already registered");
  }

  const validRoles = ["admin", "teacher", "parent"];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  if (!password || password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const passwordHash = await hashPassword(password);

  const user = await userSql.createUser({
    email,
    passwordHash,
    role,
    firstName,
    lastName,
    phone,
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      isActive: user.is_active,
      createdAt: user.created_at,
    },
    accessToken,
    refreshToken,
  };
};

const login = async (loginData) => {
  const { email, password, ipAddress, userAgent } = loginData;

  const user = await userSql.getUserWithPassword(email);
  
  if (!user) {
    await userSql.createLoginAudit({
      userId: null,
      ipAddress,
      userAgent,
      loginStatus: "failed",
      failureReason: "User not found",
    });
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.is_active) {
    await userSql.createLoginAudit({
      userId: user.id,
      ipAddress,
      userAgent,
      loginStatus: "locked",
      failureReason: "Account is deactivated",
    });
    throw new ApiError(403, "Account is deactivated. Contact administrator.");
  }

  const isPasswordValid = await comparePassword(password, user.password_hash);
  
  if (!isPasswordValid) {
    await userSql.createLoginAudit({
      userId: user.id,
      ipAddress,
      userAgent,
      loginStatus: "failed",
      failureReason: "Invalid password",
    });
    throw new ApiError(401, "Invalid email or password");
  }

  await userSql.updateLastLogin(user.id);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await userSql.createSession({
    userId: user.id,
    refreshToken,
    ipAddress,
    userAgent,
    expiresAt,
  });

  await userSql.createLoginAudit({
    userId: user.id,
    ipAddress,
    userAgent,
    loginStatus: "success",
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      lastLogin: user.last_login,
    },
    accessToken,
    refreshToken,
  };
};

const logout = async (refreshToken) => {
  if (refreshToken) {
    await userSql.deleteSession(refreshToken);
  }
  return { message: "Logged out successfully" };
};

const refreshToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const session = await userSql.findSessionByRefreshToken(refreshToken);
  if (!session) {
    throw new ApiError(401, "Session not found or expired");
  }

  const user = await userSql.findUserById(decoded.id);
  if (!user || !user.is_active) {
    throw new ApiError(401, "User not found or inactive");
  }

  const accessToken = generateAccessToken(user);

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    },
  };
};

const requestPasswordReset = async (email) => {
  const user = await userSql.findUserByEmail(email);
  
  if (!user) {
    return { message: "If the email exists, a reset link will be sent" };
  }

  const resetToken = generateResetToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 1);

  await userSql.setPasswordResetToken(email, resetToken, expires);

  return {
    message: "If the email exists, a reset link will be sent",
    resetToken,
  };
};

const resetPassword = async (token, newPassword) => {
  const user = await userSql.findUserByResetToken(token);
  
  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  const passwordHash = await hashPassword(newPassword);

  await userSql.updatePassword(user.id, passwordHash);

  await userSql.createLoginAudit({
    userId: user.id,
    ipAddress: null,
    userAgent: null,
    loginStatus: "password_changed",
    failureReason: "Password reset",
  });

  await userSql.deleteAllUserSessions(user.id);

  return { message: "Password reset successfully" };
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await userSql.getUserWithPassword(
    (await userSql.findUserById(userId)).email
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await comparePassword(oldPassword, user.password_hash);
  if (!isPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  const passwordHash = await hashPassword(newPassword);

  await userSql.updatePassword(userId, passwordHash);

  await userSql.createLoginAudit({
    userId,
    ipAddress: null,
    userAgent: null,
    loginStatus: "password_changed",
    failureReason: "User initiated",
  });

  await userSql.deleteAllUserSessions(userId);

  return { message: "Password changed successfully" };
};

const getUserById = async (id) => {
  const user = await userSql.findUserById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};

const getAllUsers = async (page = 1, limit = 10, role = null) => {
  return userSql.getAllUsers(page, limit, role);
};

const updateUser = async (id, updates) => {
  const user = await userSql.findUserById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return userSql.updateUser(id, updates);
};

const deactivateUser = async (id) => {
  const user = await userSql.findUserById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return userSql.deactivateUser(id);
};

const getLoginHistory = async (userId, limit = 10) => {
  return userSql.getLoginHistory(userId, limit);
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  requestPasswordReset,
  resetPassword,
  changePassword,
  getUserById,
  getAllUsers,
  updateUser,
  deactivateUser,
  getLoginHistory,
  hashPassword,
  comparePassword,
};

