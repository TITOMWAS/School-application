const db = require("../../config/db");

const createClass = async (classData) => {
  const { name, academicYearId, level, section, classTeacherId, capacity, isActive } = classData;

  const query = `
    INSERT INTO classes (name, academic_year_id, level, section, class_teacher_id, capacity, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, name, academic_year_id, level, section, class_teacher_id, capacity, is_active, created_at
  `;

  const result = await db.query(query, [
    name,
    academicYearId,
    level,
    section || null,
    classTeacherId || null,
    capacity || 40,
    isActive !== false
  ]);
  return result.rows[0];
};

const getAllClasses = async (academicYearId = null, activeOnly = false) => {
  let query = `
    SELECT c.id, c.name, c.academic_year_id, c.level, c.section, c.class_teacher_id, c.capacity, c.is_active, c.created_at, c.updated_at,
           ay.name as academic_year_name,
           u.first_name as teacher_first_name, u.last_name as teacher_last_name
    FROM classes c
    LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
    LEFT JOIN users u ON c.class_teacher_id = u.id
  `;

  const values = [];
  const conditions = [];

  if (academicYearId) {
    conditions.push(`c.academic_year_id = $${values.length + 1}`);
    values.push(academicYearId);
  }

  if (activeOnly) {
    conditions.push(`c.is_active = true`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += ` ORDER BY c.level, c.section`;

  const result = await db.query(query, values);
  return result.rows;
};

const getClassById = async (id) => {
  const query = `
    SELECT c.id, c.name, c.academic_year_id, c.level, c.section, c.class_teacher_id, c.capacity, c.is_active, c.created_at, c.updated_at,
           ay.name as academic_year_name,
           u.first_name as teacher_first_name, u.last_name as teacher_last_name
    FROM classes c
    LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
    LEFT JOIN users u ON c.class_teacher_id = u.id
    WHERE c.id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const updateClass = async (id, updates) => {
  const { name, academicYearId, level, section, classTeacherId, capacity, isActive } = updates;

  const query = `
    UPDATE classes
    SET name = COALESCE($2, name),
        academic_year_id = COALESCE($3, academic_year_id),
        level = COALESCE($4, level),
        section = COALESCE($5, section),
        class_teacher_id = $6,
        capacity = COALESCE($7, capacity),
        is_active = COALESCE($8, is_active),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, name, academic_year_id, level, section, class_teacher_id, capacity, is_active, updated_at
  `;

  const result = await db.query(query, [
    id,
    name,
    academicYearId,
    level,
    section,
    classTeacherId,
    capacity,
    isActive
  ]);
  return result.rows[0];
};

const deleteClass = async (id) => {
  const query = `
    DELETE FROM classes WHERE id = $1
    RETURNING id, name
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const classExistsInYear = async (academicYearId, level, section, excludeId = null) => {
  let query = `SELECT id FROM classes WHERE academic_year_id = $1 AND level = $2`;
  const values = [academicYearId, level];

  if (section) {
    query += ` AND section = $${values.length + 1}`;
    values.push(section);
  }

  if (excludeId) {
    query += ` AND id != $${values.length + 1}`;
    values.push(excludeId);
  }

  const result = await db.query(query, values);
  return result.rows.length > 0;
};

const assignSubjectToClass = async (classSubjectData) => {
  const { classId, subjectId, teacherId, academicYearId, isActive } = classSubjectData;

  const query = `
    INSERT INTO class_subjects (class_id, subject_id, teacher_id, academic_year_id, is_active)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (class_id, subject_id, academic_year_id) DO NOTHING
    RETURNING id, class_id, subject_id, teacher_id, academic_year_id, is_active, created_at
  `;

  const result = await db.query(query, [
    classId,
    subjectId,
    teacherId || null,
    academicYearId,
    isActive !== false
  ]);
  return result.rows[0];
};

const removeSubjectFromClass = async (classId, subjectId, academicYearId) => {
  const query = `
    DELETE FROM class_subjects 
    WHERE class_id = $1 AND subject_id = $2 AND academic_year_id = $3
    RETURNING id
  `;
  const result = await db.query(query, [classId, subjectId, academicYearId]);
  return result.rows[0];
};

const getClassSubjects = async (classId, academicYearId = null) => {
  let query = `
    SELECT cs.id, cs.class_id, cs.subject_id, cs.teacher_id, cs.academic_year_id, cs.is_active, cs.created_at,
           s.name as subject_name, s.code as subject_code, s.description as subject_description,
           u.first_name as teacher_first_name, u.last_name as teacher_last_name
    FROM class_subjects cs
    JOIN subjects s ON cs.subject_id = s.id
    LEFT JOIN users u ON cs.teacher_id = u.id
    WHERE cs.class_id = $1
  `;

  const values = [classId];

  if (academicYearId) {
    query += ` AND cs.academic_year_id = $2`;
    values.push(academicYearId);
  }

  query += ` ORDER BY s.name`;

  const result = await db.query(query, values);
  return result.rows;
};

const getSubjectClasses = async (subjectId, academicYearId = null) => {
  let query = `
    SELECT cs.id, cs.class_id, cs.subject_id, cs.teacher_id, cs.academic_year_id, cs.is_active, cs.created_at,
           c.name as class_name, c.level, c.section,
           u.first_name as teacher_first_name, u.last_name as teacher_last_name
    FROM class_subjects cs
    JOIN classes c ON cs.class_id = c.id
    LEFT JOIN users u ON cs.teacher_id = u.id
    WHERE cs.subject_id = $1
  `;

  const values = [subjectId];

  if (academicYearId) {
    query += ` AND cs.academic_year_id = $2`;
    values.push(academicYearId);
  }

  query += ` ORDER BY c.level, c.section`;

  const result = await db.query(query, values);
  return result.rows;
};

const updateClassSubjectTeacher = async (classId, subjectId, academicYearId, teacherId) => {
  const query = `
    UPDATE class_subjects
    SET teacher_id = $4, updated_at = CURRENT_TIMESTAMP
    WHERE class_id = $1 AND subject_id = $2 AND academic_year_id = $3
    RETURNING id, class_id, subject_id, teacher_id, academic_year_id, is_active
  `;
  const result = await db.query(query, [classId, subjectId, academicYearId, teacherId]);
  return result.rows[0];
};

const enrollStudentInClass = async (enrollmentData) => {
  const { classId, studentId, academicYearId, status } = enrollmentData;

  const query = `
    INSERT INTO class_students (class_id, student_id, academic_year_id, status)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (class_id, student_id, academic_year_id) DO NOTHING
    RETURNING id, class_id, student_id, academic_year_id, enrolled_at, status
  `;

  const result = await db.query(query, [classId, studentId, academicYearId, status || 'active']);
  return result.rows[0];
};

const unenrollStudentFromClass = async (classId, studentId, academicYearId) => {
  const query = `
    UPDATE class_students
    SET status = 'transferred'
    WHERE class_id = $1 AND student_id = $2 AND academic_year_id = $3
    RETURNING id
  `;
  const result = await db.query(query, [classId, studentId, academicYearId]);
  return result.rows[0];
};

const getClassStudents = async (classId, academicYearId = null, status = null) => {
  let query = `
    SELECT cs.id, cs.class_id, cs.student_id, cs.academic_year_id, cs.enrolled_at, cs.status,
           u.email as student_email, u.first_name as student_first_name, u.last_name as student_last_name
    FROM class_students cs
    JOIN users u ON cs.student_id = u.id
    WHERE cs.class_id = $1
  `;

  const values = [classId];

  if (academicYearId) {
    query += ` AND cs.academic_year_id = $2`;
    values.push(academicYearId);
  }

  if (status) {
    query += ` AND cs.status = $${values.length + 1}`;
    values.push(status);
  }

  query += ` ORDER BY u.first_name, u.last_name`;

  const result = await db.query(query, values);
  return result.rows;
};

const getStudentClasses = async (studentId, academicYearId = null) => {
  let query = `
    SELECT cs.id, cs.class_id, cs.student_id, cs.academic_year_id, cs.enrolled_at, cs.status,
           c.name as class_name, c.level, c.section,
           u.first_name as teacher_first_name, u.last_name as teacher_last_name
    FROM class_students cs
    JOIN classes c ON cs.class_id = c.id
    LEFT JOIN users u ON c.class_teacher_id = u.id
    WHERE cs.student_id = $1
  `;

  const values = [studentId];

  if (academicYearId) {
    query += ` AND cs.academic_year_id = $2`;
    values.push(academicYearId);
  }

  query += ` ORDER BY c.level, c.section`;

  const result = await db.query(query, values);
  return result.rows;
};

const isStudentEnrolledInClass = async (classId, studentId, academicYearId) => {
  const query = `
    SELECT id FROM class_students
    WHERE class_id = $1 AND student_id = $2 AND academic_year_id = $3 AND status = 'active'
  `;
  const result = await db.query(query, [classId, studentId, academicYearId]);
  return result.rows.length > 0;
};

const getClassStudentCount = async (classId, academicYearId = null) => {
  let query = `
    SELECT COUNT(*) as count FROM class_students
    WHERE class_id = $1 AND status = 'active'
  `;
  
  const values = [classId];
  
  if (academicYearId) {
    query += ` AND academic_year_id = $2`;
    values.push(academicYearId);
  }
  
  const result = await db.query(query, values);
  return parseInt(result.rows[0].count);
};

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  classExistsInYear,
  assignSubjectToClass,
  removeSubjectFromClass,
  getClassSubjects,
  getSubjectClasses,
  updateClassSubjectTeacher,
  enrollStudentInClass,
  unenrollStudentFromClass,
  getClassStudents,
  getStudentClasses,
  isStudentEnrolledInClass,
  getClassStudentCount,
};

