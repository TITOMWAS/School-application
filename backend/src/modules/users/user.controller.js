const userService = require("./user.service");

const register = async (req, res, next) => {
  try {
    const { email, password, role, firstName, lastName, phone } = req.body;

    const result = await userService.register({
      email,
      password,
      role,
      firstName,
      lastName,
      phone,
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
    const { firstName, lastName, phone, isActive } = req.body;

    const user = await userService.updateUser(parseInt(id), {
      firstName,
      lastName,
      phone,
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
  getUserById,
  updateUser,
  deactivateUser,
  getLoginHistory,
};

