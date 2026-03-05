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
  const { email, password, role, firstName, lastName, phone, address } = userData;

  const existingUser = await userSql.findUserByEmail(email);
  if (existingUser) {
    throw new ApiError(400, "Email already registered");
  }

  const validRoles = ["admin", "teacher", "parent", "student"];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  let passwordHash = null;
  if (password && password.length > 0) {
    if (password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters");
    }
    passwordHash = await hashPassword(password);
  }

  const user = await userSql.createUser({
    email,
    passwordHash,
    role,
    firstName,
    lastName,
    phone,
    address,
  });

  if (["admin", "teacher", "parent"].includes(role)) {
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
        address: user.address,
        isActive: user.is_active,
        createdAt: user.created_at,
      },
      accessToken,
      refreshToken,
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      address: user.address,
      isActive: user.is_active,
      createdAt: user.created_at,
    },
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

  if (user.role === "student") {
    throw new ApiError(403, "Student accounts cannot log in");
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
      address: user.address,
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

const refreshTokenFn = async (refreshToken) => {
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

const searchUsers = async (searchTerm, role = null, page = 1, limit = 10) => {
  if (!searchTerm || searchTerm.trim().length === 0) {
    throw new ApiError(400, "Search term is required");
  }
  return userSql.searchUsers(searchTerm.trim(), role, page, limit);
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

const linkStudentToParent = async (linkData) => {
  const { parentId, studentId, relationship, isPrimary, createdBy } = linkData;

  const parent = await userSql.findUserById(parentId);
  if (!parent || parent.role !== "parent") {
    throw new ApiError(400, "Invalid parent user");
  }

  const student = await userSql.findUserById(studentId);
  if (!student || student.role !== "student") {
    throw new ApiError(400, "Invalid student user");
  }

  const existingLink = await userSql.isParentOfStudent(parentId, studentId);
  if (existingLink) {
    throw new ApiError(400, "This student is already linked to this parent");
  }

  return userSql.linkStudentToParent({
    parentId,
    studentId,
    relationship,
    isPrimary,
    createdBy,
  });
};

const unlinkStudentFromParent = async (parentId, studentId) => {
  const existingLink = await userSql.isParentOfStudent(parentId, studentId);
  if (!existingLink) {
    throw new ApiError(400, "Link does not exist");
  }

  return userSql.unlinkStudentFromParent(parentId, studentId);
};

const getChildrenByParent = async (parentId) => {
  const parent = await userSql.findUserById(parentId);
  if (!parent || parent.role !== "parent") {
    throw new ApiError(400, "Invalid parent user");
  }

  return userSql.getChildrenByParent(parentId);
};

const getParentsByStudent = async (studentId) => {
  const student = await userSql.findUserById(studentId);
  if (!student || student.role !== "student") {
    throw new ApiError(400, "Invalid student user");
  }

  return userSql.getParentsByStudent(studentId);
};

const createSubject = async (subjectData) => {
  const { name, code, description } = subjectData;

  if (!name || !code) {
    throw new ApiError(400, "Name and code are required");
  }

  const existingCode = await userSql.subjectCodeExists(code);
  if (existingCode) {
    throw new ApiError(400, "Subject code already exists");
  }

  return userSql.createSubject({ name, code, description });
};

const getAllSubjects = async (activeOnly = true) => {
  return userSql.getAllSubjects(activeOnly);
};

const getSubjectById = async (id) => {
  const subject = await userSql.getSubjectById(id);
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }
  return subject;
};

const updateSubject = async (id, updates) => {
  const subject = await userSql.getSubjectById(id);
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  if (updates.code && updates.code !== subject.code) {
    const existingCode = await userSql.subjectCodeExists(updates.code, id);
    if (existingCode) {
      throw new ApiError(400, "Subject code already exists");
    }
  }

  return userSql.updateSubject(id, updates);
};

const assignSubjectToTeacher = async (teacherId, subjectId, isPrimary = true) => {

  const teacher = await userSql.findUserById(teacherId);
  if (!teacher || teacher.role !== "teacher") {
    throw new ApiError(400, "Invalid teacher user");
  }

  const subject = await userSql.getSubjectById(subjectId);
  if (!subject) {
    throw new ApiError(400, "Invalid subject");
  }

  const existingAssignment = await userSql.isTeacherOfSubject(teacherId, subjectId);
  if (existingAssignment) {
    throw new ApiError(400, "Teacher is already assigned to this subject");
  }

  return userSql.assignSubjectToTeacher(teacherId, subjectId, isPrimary);
};

const removeSubjectFromTeacher = async (teacherId, subjectId) => {
  const existingAssignment = await userSql.isTeacherOfSubject(teacherId, subjectId);
  if (!existingAssignment) {
    throw new ApiError(400, "Teacher is not assigned to this subject");
  }

  return userSql.removeSubjectFromTeacher(teacherId, subjectId);
};

const getTeacherSubjects = async (teacherId) => {
  const teacher = await userSql.findUserById(teacherId);
  if (!teacher || teacher.role !== "teacher") {
    throw new ApiError(400, "Invalid teacher user");
  }

  return userSql.getTeacherSubjects(teacherId);
};

const getSubjectTeachers = async (subjectId) => {
  const subject = await userSql.getSubjectById(subjectId);
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  return userSql.getSubjectTeachers(subjectId);
};

module.exports = {

  register,
  login,
  logout,
  refreshToken: refreshTokenFn,
  requestPasswordReset,
  resetPassword,
  changePassword,

  getUserById,
  getAllUsers,
  searchUsers,
  updateUser,
  deactivateUser,
  getLoginHistory,

  linkStudentToParent,
  unlinkStudentFromParent,
  getChildrenByParent,
  getParentsByStudent,

  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,

  assignSubjectToTeacher,
  removeSubjectFromTeacher,
  getTeacherSubjects,
  getSubjectTeachers,

  hashPassword,
  comparePassword,
};
