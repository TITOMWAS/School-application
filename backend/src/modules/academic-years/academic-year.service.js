const academicYearSql = require("./academic-year.sql");
const ApiError = require("../../utils/ApiError");

const createAcademicYear = async (yearData) => {
  const { name, startDate, endDate, isActive, isCurrent } = yearData;

  if (!name || !startDate || !endDate) {
    throw new ApiError(400, "Name, start date, and end date are required");
  }

  if (new Date(startDate) >= new Date(endDate)) {
    throw new ApiError(400, "End date must be after start date");
  }

  const existingYear = await academicYearSql.academicYearNameExists(name);
  if (existingYear) {
    throw new ApiError(400, "Academic year with this name already exists");
  }

  if (isCurrent) {
    await academicYearSql.setCurrentAcademicYear(null);
  }

  return academicYearSql.createAcademicYear({
    name,
    startDate,
    endDate,
    isActive: isActive || isCurrent || false,
    isCurrent: isCurrent || false,
  });
};

const getAllAcademicYears = async (activeOnly = false) => {
  return academicYearSql.getAllAcademicYears(activeOnly);
};

const getAcademicYearById = async (id) => {
  const year = await academicYearSql.getAcademicYearById(id);
  if (!year) {
    throw new ApiError(404, "Academic year not found");
  }
  return year;
};

const getCurrentAcademicYear = async () => {
  const year = await academicYearSql.getCurrentAcademicYear();
  if (!year) {
    throw new ApiError(404, "No current academic year set");
  }
  return year;
};

const updateAcademicYear = async (id, updates) => {
  const year = await academicYearSql.getAcademicYearById(id);
  if (!year) {
    throw new ApiError(404, "Academic year not found");
  }

  if (updates.name && updates.name !== year.name) {
    const existingYear = await academicYearSql.academicYearNameExists(updates.name, id);
    if (existingYear) {
      throw new ApiError(400, "Academic year with this name already exists");
    }
  }

  if (updates.startDate || updates.endDate) {
    const startDate = updates.startDate || year.start_date;
    const endDate = updates.endDate || year.end_date;
    if (new Date(startDate) >= new Date(endDate)) {
      throw new ApiError(400, "End date must be after start date");
    }
  }

  return academicYearSql.updateAcademicYear(id, updates);
};

const deleteAcademicYear = async (id) => {
  const year = await academicYearSql.getAcademicYearById(id);
  if (!year) {
    throw new ApiError(404, "Academic year not found");
  }

  const terms = await academicYearSql.getTermsByAcademicYear(id);
  if (terms && terms.length > 0) {
    throw new ApiError(400, "Cannot delete academic year with existing terms. Delete terms first.");
  }

  return academicYearSql.deleteAcademicYear(id);
};

const setCurrentAcademicYear = async (id) => {
  const year = await academicYearSql.getAcademicYearById(id);
  if (!year) {
    throw new ApiError(404, "Academic year not found");
  }

  const terms = await academicYearSql.getTermsByAcademicYear(id);
  if (!terms || terms.length === 0) {
    throw new ApiError(400, "Cannot set academic year as current without defined terms");
  }

  return academicYearSql.setCurrentAcademicYear(id);
};

const createTerm = async (termData) => {
  const { academicYearId, name, startDate, endDate, termNumber, isActive } = termData;

  if (!academicYearId || !name || !startDate || !endDate || !termNumber) {
    throw new ApiError(400, "Academic year ID, name, start date, end date, and term number are required");
  }

  const academicYear = await academicYearSql.getAcademicYearById(academicYearId);
  if (!academicYear) {
    throw new ApiError(400, "Academic year not found");
  }

  if (termNumber < 1 || termNumber > 4) {
    throw new ApiError(400, "Term number must be between 1 and 4");
  }

  const existingTerm = await academicYearSql.termNumberExistsInYear(academicYearId, termNumber);
  if (existingTerm) {
    throw new ApiError(400, `Term ${termNumber} already exists for this academic year`);
  }

  const yearStart = new Date(academicYear.start_date);
  const yearEnd = new Date(academicYear.end_date);
  const termStart = new Date(startDate);
  const termEnd = new Date(endDate);

  if (termStart < yearStart || termStart > yearEnd) {
    throw new ApiError(400, "Term start date must be within academic year dates");
  }

  if (termEnd < yearStart || termEnd > yearEnd) {
    throw new ApiError(400, "Term end date must be within academic year dates");
  }

  if (termStart >= termEnd) {
    throw new ApiError(400, "Term end date must be after start date");
  }

  return academicYearSql.createTerm({
    academicYearId,
    name,
    startDate,
    endDate,
    termNumber,
    isActive,
  });
};

const getTermsByAcademicYear = async (academicYearId, activeOnly = false) => {
  const academicYear = await academicYearSql.getAcademicYearById(academicYearId);
  if (!academicYear) {
    throw new ApiError(404, "Academic year not found");
  }

  return academicYearSql.getTermsByAcademicYear(academicYearId, activeOnly);
};

const getTermById = async (id) => {
  const term = await academicYearSql.getTermById(id);
  if (!term) {
    throw new ApiError(404, "Term not found");
  }
  return term;
};

const getAllTerms = async (activeOnly = false) => {
  return academicYearSql.getAllTerms(activeOnly);
};

const getCurrentTerm = async () => {
  const term = await academicYearSql.getCurrentTerm();
  if (!term) {

    const currentYear = await academicYearSql.getCurrentAcademicYear();
    if (currentYear) {
      const terms = await academicYearSql.getTermsByAcademicYear(currentYear.id, true);
      if (terms && terms.length > 0) {
        return terms[0];
      }
    }
    throw new ApiError(404, "No current term found");
  }
  return term;
};

const updateTerm = async (id, updates) => {
  const term = await academicYearSql.getTermById(id);
  if (!term) {
    throw new ApiError(404, "Term not found");
  }

  if (updates.termNumber && updates.termNumber !== term.term_number) {
    const existingTerm = await academicYearSql.termNumberExistsInYear(term.academic_year_id, updates.termNumber, id);
    if (existingTerm) {
      throw new ApiError(400, `Term ${updates.termNumber} already exists for this academic year`);
    }
  }

  if (updates.termNumber && (updates.termNumber < 1 || updates.termNumber > 4)) {
    throw new ApiError(400, "Term number must be between 1 and 4");
  }

  if (updates.startDate || updates.endDate) {
    const academicYear = await academicYearSql.getAcademicYearById(term.academic_year_id);
    const yearStart = new Date(academicYear.start_date);
    const yearEnd = new Date(academicYear.end_date);
    const termStart = updates.startDate ? new Date(updates.startDate) : new Date(term.start_date);
    const termEnd = updates.endDate ? new Date(updates.endDate) : new Date(term.end_date);

    if (termStart < yearStart || termStart > yearEnd) {
      throw new ApiError(400, "Term start date must be within academic year dates");
    }

    if (termEnd < yearStart || termEnd > yearEnd) {
      throw new ApiError(400, "Term end date must be within academic year dates");
    }

    if (termStart >= termEnd) {
      throw new ApiError(400, "Term end date must be after start date");
    }
  }

  return academicYearSql.updateTerm(id, updates);
};

const deleteTerm = async (id) => {
  const term = await academicYearSql.getTermById(id);
  if (!term) {
    throw new ApiError(404, "Term not found");
  }

  return academicYearSql.deleteTerm(id);
};

module.exports = {

  createAcademicYear,
  getAllAcademicYears,
  getAcademicYearById,
  getCurrentAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  setCurrentAcademicYear,

  createTerm,
  getTermsByAcademicYear,
  getTermById,
  getAllTerms,
  getCurrentTerm,
  updateTerm,
  deleteTerm,
};

