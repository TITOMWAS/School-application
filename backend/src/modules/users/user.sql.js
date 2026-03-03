const db = require("../../config/db");

const createUser = async (userData) => {
  const { email, passwordHash, role, firstName, lastName, phone } = userData;
  
  const query = `
    INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, email, role, first_name, last_name, phone, is_active, created_at
  `;
  
  const values = [email, passwordHash, role, firstName, lastName, phone];
  const result = await db.query(query, values);
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const query = `
    SELECT id, email, password_hash, role, first_name, last_name, phone, 
           is_active, last_login, password_changed_at, created_at
    FROM users 
    WHERE email = $1
  `;
  const result = await db.query(query, [email]);
  return result.rows[0];
};

const findUserById = async (id) => {
  const query = `
    SELECT id, email, role, first_name, last_name, phone, 
           is_active, last_login, created_at
    FROM users 
    WHERE id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const getUserWithPassword = async (email) => {
  const query = `
    SELECT id, email, password_hash, role, first_name, last_name, phone, 
           is_active, last_login, password_changed_at
    FROM users 
    WHERE email = $1
  `;
  const result = await db.query(query, [email]);
  return result.rows[0];
};

const updateLastLogin = async (id) => {
  const query = `
    UPDATE users 
    SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, last_login
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const updatePassword = async (id, passwordHash) => {
  const query = `
    UPDATE users 
    SET password_hash = $2, 
        password_changed_at = CURRENT_TIMESTAMP,
        password_reset_token = NULL,
        password_reset_expires = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id
  `;
  const result = await db.query(query, [id, passwordHash]);
  return result.rows[0];
};

const setPasswordResetToken = async (email, resetToken, expires) => {
  const query = `
    UPDATE users 
    SET password_reset_token = $2, password_reset_expires = $3
    WHERE email = $1
    RETURNING id
  `;
  const result = await db.query(query, [email, resetToken, expires]);
  return result.rows[0];
};

const findUserByResetToken = async (token) => {
  const query = `
    SELECT id, email
    FROM users 
    WHERE password_reset_token = $1 
    AND password_reset_expires > CURRENT_TIMESTAMP
  `;
  const result = await db.query(query, [token]);
  return result.rows[0];
};

const updateUser = async (id, updates) => {
  const { firstName, lastName, phone, isActive } = updates;
  
  const query = `
    UPDATE users 
    SET first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        phone = COALESCE($4, phone),
        is_active = COALESCE($5, is_active),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, email, role, first_name, last_name, phone, is_active, updated_at
  `;
  
  const result = await db.query(query, [id, firstName, lastName, phone, isActive]);
  return result.rows[0];
};

const getAllUsers = async (page = 1, limit = 10, role = null) => {
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT id, email, role, first_name, last_name, phone, is_active, last_login, created_at
    FROM users
  `;
  
  let countQuery = `SELECT COUNT(*) FROM users`;
  const values = [];
  
  if (role) {
    query += ` WHERE role = $1`;
    countQuery += ` WHERE role = $1`;
    values.push(role);
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);
  
  const result = await db.query(query, values);
  const countResult = await db.query(countQuery, role ? [role] : []);
  
  return {
    users: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
    totalPages: Math.ceil(countResult.rows[0].count / limit)
  };
};

const deactivateUser = async (id) => {
  const query = `
    UPDATE users 
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, email
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const emailExists = async (email, excludeId = null) => {
  let query = `SELECT id FROM users WHERE email = $1`;
  const values = [email];
  
  if (excludeId) {
    query += ` AND id != $2`;
    values.push(excludeId);
  }
  
  const result = await db.query(query, values);
  return result.rows.length > 0;
};

const createLoginAudit = async (auditData) => {
  const { userId, ipAddress, userAgent, loginStatus, failureReason } = auditData;
  
  const query = `
    INSERT INTO login_audit (user_id, ip_address, user_agent, login_status, failure_reason)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, user_id, login_status, created_at
  `;
  
  const result = await db.query(query, [userId, ipAddress, userAgent, loginStatus, failureReason]);
  return result.rows[0];
};

const getLoginHistory = async (userId, limit = 10) => {
  const query = `
    SELECT id, ip_address, user_agent, login_status, failure_reason, created_at
    FROM login_audit
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;
  const result = await db.query(query, [userId, limit]);
  return result.rows;
};

const getFailedLoginAttempts = async (email, minutes = 15, limit = 5) => {
  const query = `
    SELECT la.id, la.login_status, la.failure_reason, la.created_at
    FROM login_audit la
    JOIN users u ON la.user_id = u.id
    WHERE u.email = $1 
    AND la.login_status = 'failed'
    AND la.created_at > NOW() - INTERVAL '${minutes} minutes'
    ORDER BY la.created_at DESC
    LIMIT $2
  `;
  const result = await db.query(query, [email, limit]);
  return result.rows;
};

const createSession = async (sessionData) => {
  const { userId, refreshToken, ipAddress, userAgent, expiresAt } = sessionData;
  
  const query = `
    INSERT INTO sessions (user_id, refresh_token, ip_address, user_agent, expires_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, user_id, expires_at, created_at
  `;
  
  const result = await db.query(query, [userId, refreshToken, ipAddress, userAgent, expiresAt]);
  return result.rows[0];
};

const findSessionByRefreshToken = async (refreshToken) => {
  const query = `
    SELECT s.id, s.user_id, s.refresh_token, s.expires_at, s.created_at,
           u.email, u.role, u.is_active
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.refresh_token = $1 AND s.expires_at > CURRENT_TIMESTAMP
  `;
  const result = await db.query(query, [refreshToken]);
  return result.rows[0];
};

const deleteSession = async (refreshToken) => {
  const query = `
    DELETE FROM sessions 
    WHERE refresh_token = $1
    RETURNING id
  `;
  const result = await db.query(query, [refreshToken]);
  return result.rows[0];
};

const deleteAllUserSessions = async (userId) => {
  const query = `
    DELETE FROM sessions 
    WHERE user_id = $1
    RETURNING id
  `;
  const result = await db.query(query, [userId]);
  return result.rows;
};

const cleanupExpiredSessions = async () => {
  const query = `DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP`;
  const result = await db.query(query);
  return result.rowCount;
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  getUserWithPassword,
  updateLastLogin,
  updatePassword,
  setPasswordResetToken,
  findUserByResetToken,
  updateUser,
  getAllUsers,
  deactivateUser,
  emailExists,
  createLoginAudit,
  getLoginHistory,
  getFailedLoginAttempts,
  createSession,
  findSessionByRefreshToken,
  deleteSession,
  deleteAllUserSessions,
  cleanupExpiredSessions
};

