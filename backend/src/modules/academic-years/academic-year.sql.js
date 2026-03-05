const db = require("../../config/db");

const createAcademicYear = async (yearData) => {
  const { name, startDate, endDate, isActive, isCurrent } = yearData;

  const query = `
    INSERT INTO academic_years (name, start_date, end_date, is_active, is_current)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, start_date, end_date, is_active, is_current, created_at
  `;

  const result = await db.query(query, [name, startDate, endDate, isActive || false, isCurrent || false]);
  return result.rows[0];
};

const getAllAcademicYears = async (activeOnly = false) => {
  let query = `
    SELECT id, name, start_date, end_date, is_active, is_current, created_at, updated_at
    FROM academic_years
  `;

  if (activeOnly) {
    query += ` WHERE is_active = true`;
  }

  query += ` ORDER BY start_date DESC`;

  const result = await db.query(query);
  return result.rows;
};

const getAcademicYearById = async (id) => {
  const query = `
    SELECT id, name, start_date, end_date, is_active, is_current, created_at, updated_at
    FROM academic_years WHERE id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const getCurrentAcademicYear = async () => {
  const query = `
    SELECT id, name, start_date, end_date, is_active, is_current, created_at, updated_at
    FROM academic_years WHERE is_current = true
    LIMIT 1
  `;
  const result = await db.query(query);
  return result.rows[0];
};

const updateAcademicYear = async (id, updates) => {
  const { name, startDate, endDate, isActive, isCurrent } = updates;

  const query = `
    UPDATE academic_years
    SET name = COALESCE($2, name),
        start_date = COALESCE($3, start_date),
        end_date = COALESCE($4, end_date),
        is_active = COALESCE($5, is_active),
        is_current = COALESCE($6, is_current),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, name, start_date, end_date, is_active, is_current, updated_at
  `;

  const result = await db.query(query, [id, name, startDate, endDate, isActive, isCurrent]);
  return result.rows[0];
};

const deleteAcademicYear = async (id) => {
  const query = `
    DELETE FROM academic_years WHERE id = $1
    RETURNING id, name
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const setCurrentAcademicYear = async (id) => {

  await db.query(`UPDATE academic_years SET is_current = false, is_active = false WHERE is_current = true`);

  const query = `
    UPDATE academic_years
    SET is_current = true, is_active = true, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, name, start_date, end_date, is_active, is_current, updated_at
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const academicYearNameExists = async (name, excludeId = null) => {
  let query = `SELECT id FROM academic_years WHERE name = $1`;
  const values = [name];

  if (excludeId) {
    query += ` AND id != $2`;
    values.push(excludeId);
  }

  const result = await db.query(query, values);
  return result.rows.length > 0;
};

const createTerm = async (termData) => {
  const { academicYearId, name, startDate, endDate, termNumber, isActive } = termData;

  const query = `
    INSERT INTO terms (academic_year_id, name, start_date, end_date, term_number, is_active)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, academic_year_id, name, start_date, end_date, term_number, is_active, created_at
  `;

  const result = await db.query(query, [academicYearId, name, startDate, endDate, termNumber, isActive !== false]);
  return result.rows[0];
};

const getTermsByAcademicYear = async (academicYearId, activeOnly = false) => {
  let query = `
    SELECT t.id, t.academic_year_id, t.name, t.start_date, t.end_date, t.term_number, t.is_active, t.created_at, t.updated_at,
           ay.name as academic_year_name, ay.start_date as year_start_date, ay.end_date as year_end_date
    FROM terms t
    JOIN academic_years ay ON t.academic_year_id = ay.id
    WHERE t.academic_year_id = $1
  `;

  if (activeOnly) {
    query += ` AND t.is_active = true`;
  }

  query += ` ORDER BY t.term_number`;

  const result = await db.query(query, [academicYearId]);
  return result.rows;
};

const getTermById = async (id) => {
  const query = `
    SELECT t.id, t.academic_year_id, t.name, t.start_date, t.end_date, t.term_number, t.is_active, t.created_at, t.updated_at,
           ay.name as academic_year_name, ay.start_date as year_start_date, ay.end_date as year_end_date
    FROM terms t
    JOIN academic_years ay ON t.academic_year_id = ay.id
    WHERE t.id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const getAllTerms = async (activeOnly = false) => {
  let query = `
    SELECT t.id, t.academic_year_id, t.name, t.start_date, t.end_date, t.term_number, t.is_active, t.created_at, t.updated_at,
           ay.name as academic_year_name, ay.start_date as year_start_date, ay.end_date as year_end_date
    FROM terms t
    JOIN academic_years ay ON t.academic_year_id = ay.id
  `;

  if (activeOnly) {
    query += ` WHERE t.is_active = true`;
  }

  query += ` ORDER BY ay.start_date DESC, t.term_number`;

  const result = await db.query(query);
  return result.rows;
};

const getCurrentTerm = async () => {
  const query = `
    SELECT t.id, t.academic_year_id, t.name, t.start_date, t.end_date, t.term_number, t.is_active, t.created_at, t.updated_at,
           ay.name as academic_year_name, ay.is_current as year_is_current
    FROM terms t
    JOIN academic_years ay ON t.academic_year_id = ay.id
    WHERE ay.is_current = true AND t.is_active = true
      AND CURRENT_DATE BETWEEN t.start_date AND t.end_date
    LIMIT 1
  `;
  const result = await db.query(query);
  return result.rows[0];
};

const updateTerm = async (id, updates) => {
  const { name, startDate, endDate, termNumber, isActive } = updates;

  const query = `
    UPDATE terms
    SET name = COALESCE($2, name),
        start_date = COALESCE($3, start_date),
        end_date = COALESCE($4, end_date),
        term_number = COALESCE($5, term_number),
        is_active = COALESCE($6, is_active),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, academic_year_id, name, start_date, end_date, term_number, is_active, updated_at
  `;

  const result = await db.query(query, [id, name, startDate, endDate, termNumber, isActive]);
  return result.rows[0];
};

const deleteTerm = async (id) => {
  const query = `
    DELETE FROM terms WHERE id = $1
    RETURNING id, academic_year_id, name
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

const termNumberExistsInYear = async (academicYearId, termNumber, excludeId = null) => {
  let query = `SELECT id FROM terms WHERE academic_year_id = $1 AND term_number = $2`;
  const values = [academicYearId, termNumber];

  if (excludeId) {
    query += ` AND id != $3`;
    values.push(excludeId);
  }

  const result = await db.query(query, values);
  return result.rows.length > 0;
};

module.exports = {

  createAcademicYear,
  getAllAcademicYears,
  getAcademicYearById,
  getCurrentAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  setCurrentAcademicYear,
  academicYearNameExists,

  createTerm,
  getTermsByAcademicYear,
  getTermById,
  getAllTerms,
  getCurrentTerm,
  updateTerm,
  deleteTerm,
  termNumberExistsInYear,
};

