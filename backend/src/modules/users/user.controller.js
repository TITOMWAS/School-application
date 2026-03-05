const userService = require("./user.service");

const register = async (req, res, next) => {
  try {
    const { email, password, role, firstName, lastName, phone, address } = req.body;

    const result = await userService.register({
      email,
      password,
      role,
      firstName,
      lastName,
      phone,
      address,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("user-agent");

    const result = await userService.login({
      email,
      password,
      ipAddress,
      userAgent,
    });

    res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken || req.query.refreshToken;
    await userService.logout(refreshToken);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const result = await userService.refreshToken(refreshToken);

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await userService.requestPasswordReset(email);

    res.json({
      success: true,
      message: result.message,
      data: result.resetToken ? { resetToken: result.resetToken } : {},
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    await userService.resetPassword(token, newPassword);

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    await userService.changePassword(userId, oldPassword, newPassword);

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.id);

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        address: user.address,
        profilePicture: user.profile_picture,
        isActive: user.is_active,
        lastLogin: user.last_login,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role } = req.query;

    const result = await userService.getAllUsers(
      parseInt(page),
      parseInt(limit),
      role
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;

    if (!search) {
      return res.status(400).json({
        success: false,
        message: "Search term is required",
      });
    }

    const result = await userService.searchUsers(
      search,
      role,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(parseInt(id));

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        address: user.address,
        profilePicture: user.profile_picture,
        isActive: user.is_active,
        lastLogin: user.last_login,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, address, profilePicture, isActive } = req.body;

    const user = await userService.updateUser(parseInt(id), {
      firstName,
      lastName,
      phone,
      address,
      profilePicture,
      isActive,
    });

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    await userService.deactivateUser(parseInt(id));

    res.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getLoginHistory = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.id;

    const history = await userService.getLoginHistory(userId, parseInt(limit));

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

const linkStudentToParent = async (req, res, next) => {
  try {
    const { parentId, studentId, relationship, isPrimary } = req.body;
    const createdBy = req.user.id;

    const link = await userService.linkStudentToParent({
      parentId: parseInt(parentId),
      studentId: parseInt(studentId),
      relationship,
      isPrimary,
      createdBy,
    });

    res.status(201).json({
      success: true,
      message: "Student linked to parent successfully",
      data: link,
    });
  } catch (error) {
    next(error);
  }
};

const unlinkStudentFromParent = async (req, res, next) => {
  try {
    const { parentId, studentId } = req.params;

    await userService.unlinkStudentFromParent(
      parseInt(parentId),
      parseInt(studentId)
    );

    res.json({
      success: true,
      message: "Student unlinked from parent successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getChildrenByParent = async (req, res, next) => {
  try {
    const { parentId } = req.params;

    const children = await userService.getChildrenByParent(parseInt(parentId));

    res.json({
      success: true,
      data: children,
    });
  } catch (error) {
    next(error);
  }
};

const getParentsByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const parents = await userService.getParentsByStudent(parseInt(studentId));

    res.json({
      success: true,
      data: parents,
    });
  } catch (error) {
    next(error);
  }
};

const createSubject = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;

    const subject = await userService.createSubject({
      name,
      code,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

const getAllSubjects = async (req, res, next) => {
  try {
    const { activeOnly = true } = req.query;

    const subjects = await userService.getAllSubjects(activeOnly !== "false");

    res.json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

const getSubjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subject = await userService.getSubjectById(parseInt(id));

    res.json({
      success: true,
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const subject = await userService.updateSubject(parseInt(id), {
      name,
      description,
      isActive,
    });

    res.json({
      success: true,
      message: "Subject updated successfully",
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

const assignSubjectToTeacher = async (req, res, next) => {
  try {
    const { teacherId, subjectId, isPrimary } = req.body;

    const assignment = await userService.assignSubjectToTeacher(
      parseInt(teacherId),
      parseInt(subjectId),
      isPrimary
    );

    res.status(201).json({
      success: true,
      message: "Subject assigned to teacher successfully",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

const removeSubjectFromTeacher = async (req, res, next) => {
  try {
    const { teacherId, subjectId } = req.params;

    await userService.removeSubjectFromTeacher(
      parseInt(teacherId),
      parseInt(subjectId)
    );

    res.json({
      success: true,
      message: "Subject removed from teacher successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getTeacherSubjects = async (req, res, next) => {
  try {
    const { teacherId } = req.params;

    const subjects = await userService.getTeacherSubjects(parseInt(teacherId));

    res.json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

const getSubjectTeachers = async (req, res, next) => {
  try {
    const { subjectId } = req.params;

    const teachers = await userService.getSubjectTeachers(parseInt(subjectId));

    res.json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  requestPasswordReset,
  resetPassword,
  changePassword,
  getCurrentUser,
  getAllUsers,
  searchUsers,
  getUserById,
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
};

