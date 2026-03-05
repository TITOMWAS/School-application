const academicYearService = require("./academic-year.service");

const createAcademicYear = async (req, res, next) => {
  try {
    const { name, startDate, endDate, isActive, isCurrent } = req.body;

    const year = await academicYearService.createAcademicYear({
      name,
      startDate,
      endDate,
      isActive,
      isCurrent,
    });

    res.status(201).json({
      success: true,
      message: "Academic year created successfully",
      data: year,
    });
  } catch (error) {
    next(error);
  }
};

const getAllAcademicYears = async (req, res, next) => {
  try {
    const { activeOnly = false } = req.query;

    const years = await academicYearService.getAllAcademicYears(activeOnly !== "false");

    res.json({
      success: true,
      data: years,
    });
  } catch (error) {
    next(error);
  }
};

const getAcademicYearById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const year = await academicYearService.getAcademicYearById(parseInt(id));

    res.json({
      success: true,
      data: year,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentAcademicYear = async (req, res, next) => {
  try {
    const year = await academicYearService.getCurrentAcademicYear();

    res.json({
      success: true,
      data: year,
    });
  } catch (error) {
    next(error);
  }
};

const updateAcademicYear = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, isActive, isCurrent } = req.body;

    const year = await academicYearService.updateAcademicYear(parseInt(id), {
      name,
      startDate,
      endDate,
      isActive,
      isCurrent,
    });

    res.json({
      success: true,
      message: "Academic year updated successfully",
      data: year,
    });
  } catch (error) {
    next(error);
  }
};

const deleteAcademicYear = async (req, res, next) => {
  try {
    const { id } = req.params;

    await academicYearService.deleteAcademicYear(parseInt(id));

    res.json({
      success: true,
      message: "Academic year deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const setCurrentAcademicYear = async (req, res, next) => {
  try {
    const { id } = req.params;

    const year = await academicYearService.setCurrentAcademicYear(parseInt(id));

    res.json({
      success: true,
      message: "Academic year set as current successfully",
      data: year,
    });
  } catch (error) {
    next(error);
  }
};

const createTerm = async (req, res, next) => {
  try {
    const { academicYearId, name, startDate, endDate, termNumber, isActive } = req.body;

    const term = await academicYearService.createTerm({
      academicYearId: parseInt(academicYearId),
      name,
      startDate,
      endDate,
      termNumber: parseInt(termNumber),
      isActive,
    });

    res.status(201).json({
      success: true,
      message: "Term created successfully",
      data: term,
    });
  } catch (error) {
    next(error);
  }
};

const getTermsByAcademicYear = async (req, res, next) => {
  try {
    const { academicYearId } = req.params;
    const { activeOnly = false } = req.query;

    const terms = await academicYearService.getTermsByAcademicYear(
      parseInt(academicYearId),
      activeOnly !== "false"
    );

    res.json({
      success: true,
      data: terms,
    });
  } catch (error) {
    next(error);
  }
};

const getTermById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const term = await academicYearService.getTermById(parseInt(id));

    res.json({
      success: true,
      data: term,
    });
  } catch (error) {
    next(error);
  }
};

const getAllTerms = async (req, res, next) => {
  try {
    const { activeOnly = false } = req.query;

    const terms = await academicYearService.getAllTerms(activeOnly !== "false");

    res.json({
      success: true,
      data: terms,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentTerm = async (req, res, next) => {
  try {
    const term = await academicYearService.getCurrentTerm();

    res.json({
      success: true,
      data: term,
    });
  } catch (error) {
    next(error);
  }
};

const updateTerm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, termNumber, isActive } = req.body;

    const term = await academicYearService.updateTerm(parseInt(id), {
      name,
      startDate,
      endDate,
      termNumber: termNumber ? parseInt(termNumber) : undefined,
      isActive,
    });

    res.json({
      success: true,
      message: "Term updated successfully",
      data: term,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTerm = async (req, res, next) => {
  try {
    const { id } = req.params;

    await academicYearService.deleteTerm(parseInt(id));

    res.json({
      success: true,
      message: "Term deleted successfully",
    });
  } catch (error) {
    next(error);
  }
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

