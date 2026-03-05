const db = require("../../config/db");

const markAttendance = async (attendanceData) => {
  const {
    studentId, classId, academicYearId, termId, date, status,
    periodNumber, subjectId, markedBy, remarks
  } = attendanceData;

  const query = `
    INSERT INTO attendance (
      student_id, class_id, academic_year_id, term_id, date, status,
      period_number, subject_id, marked_by, remarks
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (student_id, class_id, date, COALESCE(period_number, 0), COALESCE(subject_id, 0))
    DO UPDATE SET
      status = $6,
      period_number = $7,
      subject_id = $8,
      marked_by = $9,
      remarks = $10,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id, student_id, class_id, academic_year_id, term_id, date, status,
              period_number, subject_id, marked_by, remarks, is_locked, locked_at, locked_by, created_at, updated_at
  `;

  const result = await db.query(query, [
    studentId, classId, academicYearId, termId || null, date, status,
    periodNumber || null, subjectId || null, markedBy || null, remarks || null
  ]);
  return result.rows[0];
};

const bulkMarkAttendance = async (attendanceArray, markedBy) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const results = [];
    for (const attendance of attendanceArray) {
      const { studentId, classId, academicYearId, termId, date, status, periodNumber, subjectId, remarks } = attendance;

      const query = `
        INSERT INTO attendance (
          student_id, class_id, academic_year_id, term_id, date, status,
          period_number, subject_id, marked_by, remarks
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (student_id, class_id, date, COALESCE(period_number, 0), COALESCE(subject_id, 0))
        DO UPDATE SET
          status = $6,
          period_number = $7,
          subject_id = $8,
          marked_by = $9,
          remarks = $10,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, student_id, class_id, academic_year_id, term_id, date, status,
                  period_number, subject_id, marked_by, remarks, is_locked, created_at
      `;

      const result = await client.query(query, [
        studentId, classId, academicYearId, termId || null, date, status,
        periodNumber || null, subjectId || null, markedBy, remarks || null
      ]);
      results.push(result.rows[0]);
    }

    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getAttendanceByStudent = async (studentId, academicYearId = null, termId = null, startDate = null, endDate = null) => {
  let query = `
    SELECT a.id, a.student_id, a.class_id, a.academic_year_id, a.term_id, a.date, a.status,
           a.period_number, a.subject_id, a.marked_by, a.remarks, a.is_locked, a.locked_at, a.locked_by, a.created_at, a.updated_at,
           u.first_name as student_first_name, u.last_name as student_last_name,
           c.name as class_name, c.level, c.section,
           s.name as subject_name, s.code as subject_code,
           ay.name as academic_year_name,
           t.name as term_name,
           m.first_name as marked_by_first_name, m.last_name as marked_by_last_name
    FROM attendance a
    JOIN users u ON a.student_id = u.id
    JOIN classes c ON a.class_id = c.id
    LEFT JOIN subjects s ON a.subject_id = s.id
    LEFT JOIN academic_years ay ON a.academic_year_id = ay.id
    LEFT JOIN terms t ON a.term_id = t.id
    LEFT JOIN users m ON a.marked_by = m.id
    WHERE a.student_id = $1
  `;

  const values = [studentId];

  if (academicYearId) {
    query += ` AND a.academic_year_id = $${values.length + 1}`;
    values.push(academicYearId);
  }

  if (termId) {
    query += ` AND a.term_id = $${values.length + 1}`;
    values.push(termId);
  }

  if (startDate) {
    query += ` AND a.date >= $${values.length + 1}`;
    values.push(startDate);
  }

  if (endDate) {
    query += ` AND a.date <= $${values.length + 1}`;
    values.push(endDate);
  }

  query += ` ORDER BY a.date DESC, a.period_number`;

  const result = await db.query(query, values);
  return result.rows;
};

const getAttendanceByClass = async (classId, academicYearId = null, termId = null, date = null, subjectId = null) => {
  let query = `
    SELECT a.id, a.student_id, a.class_id, a.academic_year_id, a.term_id, a.date, a.status,
           a.period_number, a.subject_id, a.marked_by, a.remarks, a.is_locked, a.locked_at, a.locked_by, a.created_at, a.updated_at,
           u.first_name as student_first_name, u.last_name as student_last_name,
           s.name as subject_name, s.code as subject_code,
           ay.name as academic_year_name,
           t.name as term_name,
           m.first_name as marked_by_first_name, m.last_name as marked_by_last_name
    FROM attendance a
    JOIN users u ON a.student_id = u.id
    LEFT JOIN subjects s ON a.subject_id = s.id
    LEFT JOIN academic_years ay ON a.academic_year_id = ay.id
    LEFT JOIN terms t ON a.term_id = t.id
    LEFT JOIN users m ON a.marked_by = m.id
    WHERE a.class_id = $1
  `;

  const values = [classId];

  if (academicYearId) {
    query += ` AND a.academic_year_id = $${values.length + 1}`;
    values.push(academicYearId);
  }

  if (termId) {
    query += ` AND a.term_id = $${values.length + 1}`;
    values.push(termId);
  }

  if (date) {
    query += ` AND a.date = $${values.length + 1}`;
    values.push(date);
  }

  if (subjectId) {
    query += ` AND a.subject_id = $${values.length + 1}`;
    values.push(subjectId);
  }

  query += ` ORDER BY a.date DESC, u.last_name, u.first_name`;

  const result = await db.query(query, values);
  return result.rows;
};

const getAttendanceByDate = async (date, classId = null, academicYearId = null) => {
  let query = `
    SELECT a.id, a.student_id, a.class_id, a.academic_year_id, a.term_id, a.date, a.status,
           a.period_number, a.subject_id, a.marked_by, a.remarks, a.is_locked, a.locked_at, a.locked_by, a.created_at, a.updated_at,
           u.first_name as student_first_name, u.last_name as student_last_name,
           c.name as class_name, c.level, c.section,
           s.name as subject_name, s.code as subject_code,
           ay.name as academic_year_name,
           m.first_name as marked_by_first_name, m.last_name as marked_by_last_name
    FROM attendance a
    JOIN users u ON a.student_id = u.id
    JOIN classes c ON a.class_id = c.id
    LEFT JOIN subjects s ON a.subject_id = s.id
    LEFT JOIN academic_years ay ON a.academic_year_id = ay.id
    LEFT JOIN users m ON a.marked_by = m.id
    WHERE a.date = $1
  `;

  const values = [date];

  if (classId) {
    query += ` AND a.class_id = $${values.length + 1}`;
    values.push(classId);
  }

  if (academicYearId) {
    query += ` AND a.academic_year_id = $${values.length + 1}`;
    values.push(academicYearId);
  }

  query += ` ORDER BY c.name, u.last_name, u.first_name`;

  const result = await db.query(query, values);
  return result.rows;
};

const getAttendanceById = async (id) => {
  const query = `
    SELECT a.id, a.student_id, a.class_id, a.academic_year_id, a.term_id, a.date, a.status,
           a.period_number, a.subject_id, a.marked_by, a.remarks, a.is_locked, a.locked_at, a.locked_by, a.created_at, a.updated_at,
           u.first_name as student_first_name, u.last_name as student_last_name,
           c.name as class_name, c.level, c.section,
           s.name as subject_name, s.code as subject_code,
           ay.name as academic_year_name,
           t.name as term_name,
           m.first_name as marked_by_first_name, m.last_name as marked_by_last_name,
           l.first_name as locked_by_first_name, l.last_name as locked_by_last_name
    FROM attendance a
    JOIN users u ON a.student_id = u.id
    JOIN classes c ON a.class_id = c.id
    LEFT JOIN subjects s ON a.subject_id = s.id
    LEFT JOIN academic_years ay ON a.academic_year_id = ay.id
    LEFT JOIN terms t ON a.term_id = t.id
    LEFT JOIN users m ON a.marked_by = m.id
    LEFT JOIN users l ON a.locked_by = l.id
    WHERE a.id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const updateAttendance = async (id, updates) => {
  const { status, periodNumber, subjectId, remarks } = updates;

  const query = `
    UPDATE attendance
    SET status = COALESCE($2, status),
        period_number = $3,
        subject_id = $4,
        remarks = $5,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, student_id, class_id, academic_year_id, term_id, date, status,
              period_number, subject_id, marked_by, remarks, is_locked, locked_at, locked_by, created_at, updated_at
  `;

  const result = await db.query(query, [id, status, periodNumber || null, subjectId || null, remarks || null]);
  return result.rows[0];
};

const deleteAttendance = async (id) => {
  const query = `
    DELETE FROM attendance WHERE id = $1
    RETURNING id, student_id, class_id, date
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const lockAttendance = async (id, lockedBy) => {
  const query = `
    UPDATE attendance
    SET is_locked = true,
        locked_at = CURRENT_TIMESTAMP,
        locked_by = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, student_id, class_id, date, is_locked, locked_at, locked_by
  `;
  const result = await db.query(query, [id, lockedBy]);
  return result.rows[0];
};

const unlockAttendance = async (id) => {
  const query = `
    UPDATE attendance
    SET is_locked = false,
        locked_at = NULL,
        locked_by = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, student_id, class_id, date, is_locked, locked_at, locked_by
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const lockClassAttendance = async (classId, date, lockedBy) => {
  const query = `
    UPDATE attendance
    SET is_locked = true,
        locked_at = CURRENT_TIMESTAMP,
        locked_by = $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE class_id = $1 AND date = $2 AND is_locked = false
    RETURNING id, student_id, class_id, date, is_locked
  `;
  const result = await db.query(query, [classId, date, lockedBy]);
  return result.rows;
};

const unlockClassAttendance = async (classId, date) => {
  const query = `
    UPDATE attendance
    SET is_locked = false,
        locked_at = NULL,
        locked_by = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE class_id = $1 AND date = $2 AND is_locked = true
    RETURNING id, student_id, class_id, date, is_locked
  `;
  const result = await db.query(query, [classId, date]);
  return result.rows;
};

const getClassAttendanceSummary = async (classId, academicYearId = null, termId = null, startDate = null, endDate = null) => {
  let query = `
    SELECT 
      u.id as student_id,
      u.first_name as student_first_name,
      u.last_name as student_last_name,
      COUNT(a.id) as total_days,
      SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_days,
      SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
      SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_days,
      SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused_days,
      ROUND(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(a.id), 0) * 100, 2) as attendance_percentage
    FROM users u
    JOIN class_students cs ON u.id = cs.student_id
    LEFT JOIN attendance a ON u.id = a.student_id AND a.class_id = cs.class_id
    WHERE cs.class_id = $1 AND cs.status = 'active'
  `;

  const values = [classId];

  if (academicYearId) {
    query += ` AND cs.academic_year_id = $${values.length + 1}`;
    values.push(academicYearId);
  }

  if (termId) {
    query += ` AND a.term_id = $${values.length + 1}`;
    values.push(termId);
  }

  if (startDate) {
    query += ` AND a.date >= $${values.length + 1}`;
    values.push(startDate);
  }

  if (endDate) {
    query += ` AND a.date <= $${values.length + 1}`;
    values.push(endDate);
  }

  query += ` GROUP BY u.id, u.first_name, u.last_name ORDER BY u.last_name, u.first_name`;

  const result = await db.query(query, values);
  return result.rows;
};

const getStudentAttendanceSummary = async (studentId, academicYearId = null, termId = null) => {
  let query = `
    SELECT 
      COUNT(a.id) as total_days,
      SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_days,
      SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
      SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_days,
      SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused_days,
      ROUND(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(a.id), 0) * 100, 2) as attendance_percentage,
      ay.name as academic_year_name,
      t.name as term_name
    FROM attendance a
    LEFT JOIN academic_years ay ON a.academic_year_id = ay.id
    LEFT JOIN terms t ON a.term_id = t.id
    WHERE a.student_id = $1
  `;

  const values = [studentId];

  if (academicYearId) {
    query += ` AND a.academic_year_id = $${values.length + 1}`;
    values.push(academicYearId);
  }

  if (termId) {
    query += ` AND a.term_id = $${values.length + 1}`;
    values.push(termId);
  }

  query += ` GROUP BY ay.name, t.name ORDER BY a.date DESC`;

  const result = await db.query(query, values);
  return result.rows;
};

const getAttendanceStats = async (academicYearId = null, termId = null, classId = null, startDate = null, endDate = null) => {
  let query = `
    SELECT 
      COUNT(DISTINCT a.student_id) as total_students,
      COUNT(a.id) as total_records,
      SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
      SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
      SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
      SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused_count,
      COUNT(DISTINCT a.date) as total_school_days,
      ROUND(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(a.id), 0) * 100, 2) as overall_attendance_percentage,
      c.name as class_name,
      c.level,
      c.section,
      ay.name as academic_year_name,
      t.name as term_name
    FROM attendance a
    LEFT JOIN classes c ON a.class_id = c.id
    LEFT JOIN academic_years ay ON a.academic_year_id = ay.id
    LEFT JOIN terms t ON a.term_id = t.id
    WHERE 1=1
  `;

  const values = [];

  if (academicYearId) {
    query += ` AND a.academic_year_id = $${values.length + 1}`;
    values.push(academicYearId);
  }

  if (termId) {
    query += ` AND a.term_id = $${values.length + 1}`;
    values.push(termId);
  }

  if (classId) {
    query += ` AND a.class_id = $${values.length + 1}`;
    values.push(classId);
  }

  if (startDate) {
    query += ` AND a.date >= $${values.length + 1}`;
    values.push(startDate);
  }

  if (endDate) {
    query += ` AND a.date <= $${values.length + 1}`;
    values.push(endDate);
  }

  query += ` GROUP BY c.name, c.level, c.section, ay.name, t.name`;

  const result = await db.query(query, values);
  return result.rows;
};

const getStudentsWithoutAttendance = async (classId, date) => {
  const query = `
    SELECT u.id as student_id, u.first_name, u.last_name, u.email
    FROM users u
    JOIN class_students cs ON u.id = cs.student_id
    WHERE cs.class_id = $1 
      AND cs.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM attendance a 
        WHERE a.student_id = u.id 
          AND a.class_id = cs.class_id 
          AND a.date = $2
      )
    ORDER BY u.last_name, u.first_name
  `;
  const result = await db.query(query, [classId, date]);
  return result.rows;
};

module.exports = {

  markAttendance,
  bulkMarkAttendance,
  getAttendanceByStudent,
  getAttendanceByClass,
  getAttendanceByDate,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,

  lockAttendance,
  unlockAttendance,
  lockClassAttendance,
  unlockClassAttendance,

  getClassAttendanceSummary,
  getStudentAttendanceSummary,
  getAttendanceStats,

  getStudentsWithoutAttendance,
};

