const db = require("../../config/db");

const createTimetableSlot = async (timetableData) => {
  const {
    classId, subjectId, teacherId, academicYearId, termId,
    dayOfWeek, periodNumber, startTime, endTime, room, isActive
  } = timetableData;

  const query = `
    INSERT INTO timetable (
      class_id, subject_id, teacher_id, academic_year_id, term_id,
      day_of_week, period_number, start_time, end_time, room, is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id, class_id, subject_id, teacher_id, academic_year_id, term_id,
              day_of_week, period_number, start_time, end_time, room, is_active, created_at
  `;

  const result = await db.query(query, [
    classId, subjectId, teacherId || null, academicYearId, termId || null,
    dayOfWeek, periodNumber, startTime, endTime, room || null, isActive !== false
  ]);
  return result.rows[0];
};

const getTimetableByClass = async (classId, academicYearId = null, termId = null) => {
  let query = `
    SELECT t.id, t.class_id, t.subject_id, t.teacher_id, t.academic_year_id, t.term_id,
           t.day_of_week, t.period_number, t.start_time, t.end_time, t.room, t.is_active, t.created_at,
           s.name as subject_name, s.code as subject_code,
           u.first_name as teacher_first_name, u.last_name as teacher_last_name,
           c.name as class_name, c.level, c.section
    FROM timetable t
    JOIN subjects s ON t.subject_id = s.id
    LEFT JOIN users u ON t.teacher_id = u.id
    JOIN classes c ON t.class_id = c.id
    WHERE t.class_id = $1
  `;

  const values = [classId];

  if (academicYearId) {
    query += ` AND t.academic_year_id = $${values.length + 1}`;
    values.push(academicYearId);
  }

  if (termId) {
    query += ` AND t.term_id = $${values.length + 1}`;
    values.push(termId);
  }

  query += ` ORDER BY t.day_of_week, t.period_number`;

  const result = await db.query(query, values);
  return result.rows;
};

const getTimetableByTeacher = async (teacherId, academicYearId = null, termId = null) => {
  let query = `
    SELECT t.id, t.class_id, t.subject_id, t.teacher_id, t.academic_year_id, t.term_id,
           t.day_of_week, t.period_number, t.start_time, t.end_time, t.room, t.is_active, t.created_at,
           s.name as subject_name, s.code as subject_code,
           c.name as class_name, c.level, c.section
    FROM timetable t
    JOIN subjects s ON t.subject_id = s.id
    JOIN classes c ON t.class_id = c.id
    WHERE t.teacher_id = $1
  `;

  const values = [teacherId];

  if (academicYearId) {
    query += ` AND t.academic_year_id = $${values.length + 1}`;
    values.push(academicYearId);
  }

  if (termId) {
    query += ` AND t.term_id = $${values.length + 1}`;
    values.push(termId);
  }

  query += ` ORDER BY t.day_of_week, t.period_number`;

  const result = await db.query(query, values);
  return result.rows;
};

const getTimetableBySubject = async (subjectId, academicYearId = null) => {
  let query = `
    SELECT t.id, t.class_id, t.subject_id, t.teacher_id, t.academic_year_id, t.term_id,
           t.day_of_week, t.period_number, t.start_time, t.end_time, t.room, t.is_active, t.created_at,
           u.first_name as teacher_first_name, u.last_name as teacher_last_name,
           c.name as class_name, c.level, c.section
    FROM timetable t
    LEFT JOIN users u ON t.teacher_id = u.id
    JOIN classes c ON t.class_id = c.id
    WHERE t.subject_id = $1
  `;

  const values = [subjectId];

  if (academicYearId) {
    query += ` AND t.academic_year_id = $${values.length + 1}`;
    values.push(academicYearId);
  }

  query += ` ORDER BY t.day_of_week, t.period_number`;

  const result = await db.query(query, values);
  return result.rows;
};

const getAllTimetable = async (academicYearId = null, termId = null) => {
  let query = `
    SELECT t.id, t.class_id, t.subject_id, t.teacher_id, t.academic_year_id, t.term_id,
           t.day_of_week, t.period_number, t.start_time, t.end_time, t.room, t.is_active, t.created_at,
           s.name as subject_name, s.code as subject_code,
           u.first_name as teacher_first_name, u.last_name as teacher_last_name,
           c.name as class_name, c.level, c.section
    FROM timetable t
    JOIN subjects s ON t.subject_id = s.id
    LEFT JOIN users u ON t.teacher_id = u.id
    JOIN classes c ON t.class_id = c.id
  `;

  const values = [];

  if (academicYearId) {
    query += ` WHERE t.academic_year_id = $${values.length + 1}`;
    values.push(academicYearId);
  }

  if (termId) {
    query += academicYearId ? ` AND` : ` WHERE`;
    query += ` t.term_id = $${values.length + 1}`;
    values.push(termId);
  }

  query += ` ORDER BY t.day_of_week, t.period_number, c.name`;

  const result = await db.query(query, values);
  return result.rows;
};

const getTimetableById = async (id) => {
  const query = `
    SELECT t.id, t.class_id, t.subject_id, t.teacher_id, t.academic_year_id, t.term_id,
           t.day_of_week, t.period_number, t.start_time, t.end_time, t.room, t.is_active, t.created_at,
           s.name as subject_name, s.code as subject_code,
           u.first_name as teacher_first_name, u.last_name as teacher_last_name,
           c.name as class_name, c.level, c.section
    FROM timetable t
    JOIN subjects s ON t.subject_id = s.id
    LEFT JOIN users u ON t.teacher_id = u.id
    JOIN classes c ON t.class_id = c.id
    WHERE t.id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const updateTimetableSlot = async (id, updates) => {
  const {
    classId, subjectId, teacherId, academicYearId, termId,
    dayOfWeek, periodNumber, startTime, endTime, room, isActive
  } = updates;

  const query = `
    UPDATE timetable
    SET class_id = COALESCE($2, class_id),
        subject_id = COALESCE($3, subject_id),
        teacher_id = $4,
        academic_year_id = COALESCE($5, academic_year_id),
        term_id = $6,
        day_of_week = COALESCE($7, day_of_week),
        period_number = COALESCE($8, period_number),
        start_time = COALESCE($9, start_time),
        end_time = COALESCE($10, end_time),
        room = $11,
        is_active = COALESCE($12, is_active),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, class_id, subject_id, teacher_id, academic_year_id, term_id,
              day_of_week, period_number, start_time, end_time, room, is_active, updated_at
  `;

  const result = await db.query(query, [
    id, classId, subjectId, teacherId, academicYearId, termId,
    dayOfWeek, periodNumber, startTime, endTime, room, isActive
  ]);
  return result.rows[0];
};

const deleteTimetableSlot = async (id) => {
  const query = `
    DELETE FROM timetable WHERE id = $1
    RETURNING id, class_id, subject_id
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const setTeacherAvailability = async (availabilityData) => {
  const { teacherId, dayOfWeek, periodNumber, isAvailable } = availabilityData;

  const query = `
    INSERT INTO teacher_availability (teacher_id, day_of_week, period_number, is_available)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (teacher_id, day_of_week, period_number) 
    DO UPDATE SET is_available = $4, updated_at = CURRENT_TIMESTAMP
    RETURNING id, teacher_id, day_of_week, period_number, is_available, created_at
  `;

  const result = await db.query(query, [teacherId, dayOfWeek, periodNumber, isAvailable !== false]);
  return result.rows[0];
};

const getTeacherAvailability = async (teacherId, dayOfWeek = null) => {
  let query = `
    SELECT id, teacher_id, day_of_week, period_number, is_available, created_at, updated_at
    FROM teacher_availability
    WHERE teacher_id = $1
  `;

  const values = [teacherId];

  if (dayOfWeek) {
    query += ` AND day_of_week = $${values.length + 1}`;
    values.push(dayOfWeek);
  }

  query += ` ORDER BY day_of_week, period_number`;

  const result = await db.query(query, values);
  return result.rows;
};

const bulkSetTeacherAvailability = async (teacherId, availabilityArray) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    

    await client.query(`DELETE FROM teacher_availability WHERE teacher_id = $1`, [teacherId]);
    

    for (const avail of availabilityArray) {
      await client.query(
        `INSERT INTO teacher_availability (teacher_id, day_of_week, period_number, is_available)
         VALUES ($1, $2, $3, $4)`,
        [teacherId, avail.dayOfWeek, avail.periodNumber, avail.isAvailable !== false]
      );
    }
    
    await client.query('COMMIT');
    

    return getTeacherAvailability(teacherId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const checkClassConflict = async (classId, academicYearId, dayOfWeek, periodNumber, excludeId = null) => {
  let query = `
    SELECT id, class_id, subject_id, teacher_id, day_of_week, period_number
    FROM timetable
    WHERE class_id = $1 AND academic_year_id = $2 
      AND day_of_week = $3 AND period_number = $4 AND is_active = true
  `;

  const values = [classId, academicYearId, dayOfWeek, periodNumber];

  if (excludeId) {
    query += ` AND id != $${values.length + 1}`;
    values.push(excludeId);
  }

  const result = await db.query(query, values);
  return result.rows;
};

const checkTeacherConflict = async (teacherId, academicYearId, dayOfWeek, periodNumber, excludeId = null) => {
  if (!teacherId) return [];

  let query = `
    SELECT id, class_id, subject_id, teacher_id, day_of_week, period_number
    FROM timetable
    WHERE teacher_id = $1 AND academic_year_id = $2 
      AND day_of_week = $3 AND period_number = $4 AND is_active = true
  `;

  const values = [teacherId, academicYearId, dayOfWeek, periodNumber];

  if (excludeId) {
    query += ` AND id != $${values.length + 1}`;
    values.push(excludeId);
  }

  const result = await db.query(query, values);
  return result.rows;
};

const checkRoomConflict = async (room, academicYearId, dayOfWeek, periodNumber, excludeId = null) => {
  if (!room) return [];

  let query = `
    SELECT id, class_id, subject_id, teacher_id, day_of_week, period_number, room
    FROM timetable
    WHERE room = $1 AND academic_year_id = $2 
      AND day_of_week = $3 AND period_number = $4 AND is_active = true
  `;

  const values = [room, academicYearId, dayOfWeek, periodNumber];

  if (excludeId) {
    query += ` AND id != $${values.length + 1}`;
    values.push(excludeId);
  }

  const result = await db.query(query, values);
  return result.rows;
};

module.exports = {

  createTimetableSlot,
  getTimetableByClass,
  getTimetableByTeacher,
  getTimetableBySubject,
  getAllTimetable,
  getTimetableById,
  updateTimetableSlot,
  deleteTimetableSlot,

  setTeacherAvailability,
  getTeacherAvailability,
  bulkSetTeacherAvailability,

  checkClassConflict,
  checkTeacherConflict,
  checkRoomConflict,
};

