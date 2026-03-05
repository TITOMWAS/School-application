const db = require("../../config/db");

const createUser = async (userData) => {
  const { email, passwordHash, role, firstName, lastName, phone, address } = userData;
  
  const query = `
    INSERT INTO users (email, password_hash, role, first_name, last_name, phone, address)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, email, role, first_name, last_name, phone, address, is_active, created_at
  `;
  
  const values = [email, passwordHash, role, firstName, lastName, phone, address || null];
  const result = await db.query(query, values);
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const query = `
    SELECT id, email, password_hash, role, first_name, last_name, phone, address, profile_picture,
           is_active, last_login, password_changed_at, created_at
    FROM users 
    WHERE email = $1
  `;
  const result = await db.query(query, [email]);
  return result.rows[0];
};

const findUserById = async (id) => {
  const query = `
    SELECT id, email, role, first_name, last_name, phone, address, profile_picture,
           is_active, last_login, created_at
    FROM users 
    WHERE id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const getUserWithPassword = async (email) => {
  const query = `
    SELECT id, email, password_hash, role, first_name, last_name, phone, address, profile_picture,
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
  const { firstName, lastName, phone, address, profilePicture, isActive } = updates;
  
  const query = `
    UPDATE users 
    SET first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        phone = COALESCE($4, phone),
        address = COALESCE($5, address),
        profile_picture = COALESCE($6, profile_picture),
        is_active = COALESCE($7, is_active),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, email, role, first_name, last_name, phone, address, profile_picture, is_active, updated_at
  `;
  
  const result = await db.query(query, [id, firstName, lastName, phone, address, profilePicture, isActive]);
  return result.rows[0];
};

const getAllUsers = async (page = 1, limit = 10, role = null) => {
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT id, email, role, first_name, last_name, phone, address, profile_picture, is_active, last_login, created_at
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

const searchUsers = async (searchTerm, role = null, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const searchPattern = `%${searchTerm}%`;
  
  let query = `
    SELECT id, email, role, first_name, last_name, phone, address, profile_picture, is_active, created_at
    FROM users
    WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)
  `;
  
  let countQuery = `
    SELECT COUNT(*) FROM users
    WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)
  `;
  const values = [searchPattern];
  
  if (role) {
    query += ` AND role = $2`;
    countQuery += ` AND role = $2`;
    values.push(role);
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);
  
  const result = await db.query(query, values);
  const countResult = await db.query(countQuery, [searchPattern, role].filter(Boolean));
  
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

const linkStudentToParent = async (linkData) => {
  const { parentId, studentId, relationship, isPrimary, createdBy } = linkData;
  
  const query = `
    INSERT INTO parent_student_links (parent_id, student_id, relationship, is_primary, created_by)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (parent_id, student_id) DO NOTHING
    RETURNING id, parent_id, student_id, relationship, is_primary, created_at
  `;
  
  const result = await db.query(query, [parentId, studentId, relationship || 'parent', isPrimary || true, createdBy || null]);
  return result.rows[0];
};

const unlinkStudentFromParent = async (parentId, studentId) => {
  const query = `
    DELETE FROM parent_student_links 
    WHERE parent_id = $1 AND student_id = $2
    RETURNING id
  `;
  const result = await db.query(query, [parentId, studentId]);
  return result.rows[0];
};

const getChildrenByParent = async (parentId) => {
  const query = `
    SELECT psl.id, psl.parent_id, psl.student_id, psl.relationship, psl.is_primary, psl.created_at,
           u.id as student_id, u.email as student_email, u.first_name as student_first_name, 
           u.last_name as student_last_name, u.phone as student_phone
    FROM parent_student_links psl
    JOIN users u ON psl.student_id = u.id
    WHERE psl.parent_id = $1
    ORDER BY psl.is_primary DESC, u.first_name
  `;
  const result = await db.query(query, [parentId]);
  return result.rows;
};

const getParentsByStudent = async (studentId) => {
  const query = `
    SELECT psl.id, psl.parent_id, psl.student_id, psl.relationship, psl.is_primary, psl.created_at,
           u.id as parent_id, u.email as parent_email, u.first_name as parent_first_name, 
           u.last_name as parent_last_name, u.phone as parent_phone
    FROM parent_student_links psl
    JOIN users u ON psl.parent_id = u.id
    WHERE psl.student_id = $1
    ORDER BY psl.is_primary DESC, u.first_name
  `;
  const result = await db.query(query, [studentId]);
  return result.rows;
};

const isParentOfStudent = async (parentId, studentId) => {
  const query = `
    SELECT id FROM parent_student_links
    WHERE parent_id = $1 AND student_id = $2
  `;
  const result = await db.query(query, [parentId, studentId]);
  return result.rows.length > 0;
};

const createSubject = async (subjectData) => {
  const { name, code, description } = subjectData;
  
  const query = `
    INSERT INTO subjects (name, code, description)
    VALUES ($1, $2, $3)
    RETURNING id, name, code, description, is_active, created_at
  `;
  
  const result = await db.query(query, [name, code, description || null]);
  return result.rows[0];
};

const getAllSubjects = async (activeOnly = true) => {
  let query = `SELECT id, name, code, description, is_active, created_at FROM subjects`;
  
  if (activeOnly) {
    query += ` WHERE is_active = true`;
  }
  
  query += ` ORDER BY name`;
  
  const result = await db.query(query);
  return result.rows;
};

const getSubjectById = async (id) => {
  const query = `
    SELECT id, name, code, description, is_active, created_at
    FROM subjects WHERE id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const updateSubject = async (id, updates) => {
  const { name, description, isActive } = updates;
  
  const query = `
    UPDATE subjects 
    SET name = COALESCE($2, name),
        description = COALESCE($3, description),
        is_active = COALESCE($4, is_active),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, name, code, description, is_active, updated_at
  `;
  
  const result = await db.query(query, [id, name, description, isActive]);
  return result.rows[0];
};

const subjectCodeExists = async (code, excludeId = null) => {
  let query = `SELECT id FROM subjects WHERE code = $1`;
  const values = [code];
  
  if (excludeId) {
    query += ` AND id != $2`;
    values.push(excludeId);
  }
  
  const result = await db.query(query, values);
  return result.rows.length > 0;
};

const assignSubjectToTeacher = async (teacherId, subjectId, isPrimary = true) => {
  const query = `
    INSERT INTO teacher_subjects (teacher_id, subject_id, is_primary)
    VALUES ($1, $2, $3)
    ON CONFLICT (teacher_id, subject_id) DO NOTHING
    RETURNING id, teacher_id, subject_id, is_primary, created_at
  `;
  
  const result = await db.query(query, [teacherId, subjectId, isPrimary]);
  return result.rows[0];
};

const removeSubjectFromTeacher = async (teacherId, subjectId) => {
  const query = `
    DELETE FROM teacher_subjects 
    WHERE teacher_id = $1 AND subject_id = $2
    RETURNING id
  `;
  const result = await db.query(query, [teacherId, subjectId]);
  return result.rows[0];
};

const getTeacherSubjects = async (teacherId) => {
  const query = `
    SELECT ts.id, ts.teacher_id, ts.subject_id, ts.is_primary, ts.created_at,
           s.name as subject_name, s.code as subject_code, s.description as subject_description
    FROM teacher_subjects ts
    JOIN subjects s ON ts.subject_id = s.id
    WHERE ts.teacher_id = $1
    ORDER BY ts.is_primary DESC, s.name
  `;
  const result = await db.query(query, [teacherId]);
  return result.rows;
};

const getSubjectTeachers = async (subjectId) => {
  const query = `
    SELECT ts.id, ts.teacher_id, ts.subject_id, ts.is_primary, ts.created_at,
           u.email as teacher_email, u.first_name as teacher_first_name, 
           u.last_name as teacher_last_name, u.phone as teacher_phone
    FROM teacher_subjects ts
    JOIN users u ON ts.teacher_id = u.id
    WHERE ts.subject_id = $1
    ORDER BY ts.is_primary DESC, u.first_name
  `;
  const result = await db.query(query, [subjectId]);
  return result.rows;
};

const isTeacherOfSubject = async (teacherId, subjectId) => {
  const query = `
    SELECT id FROM teacher_subjects
    WHERE teacher_id = $1 AND subject_id = $2
  `;
  const result = await db.query(query, [teacherId, subjectId]);
  return result.rows.length > 0;
};

const getTeachersBySubject = async (subjectId) => {
  return getSubjectTeachers(subjectId);
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
  searchUsers,
  deactivateUser,
  emailExists,
  createLoginAudit,
  getLoginHistory,
  getFailedLoginAttempts,
  createSession,
  findSessionByRefreshToken,
  deleteSession,
  deleteAllUserSessions,
  cleanupExpiredSessions,
  linkStudentToParent,
  unlinkStudentFromParent,
  getChildrenByParent,
  getParentsByStudent,
  isParentOfStudent,
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  subjectCodeExists,
  assignSubjectToTeacher,
  removeSubjectFromTeacher,
  getTeacherSubjects,
  getSubjectTeachers,
  isTeacherOfSubject,
  getTeachersBySubject
};

