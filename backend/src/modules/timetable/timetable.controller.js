const timetableService = require("./timetable.service");

const createTimetableSlot = async (req, res, next) => {
  try {
    const {
      classId, subjectId, teacherId, academicYearId, termId,
      dayOfWeek, periodNumber, startTime, endTime, room, isActive
    } = req.body;

    const slot = await timetableService.createTimetableSlot({
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
      teacherId: teacherId ? parseInt(teacherId) : undefined,
      academicYearId: parseInt(academicYearId),
      termId: termId ? parseInt(termId) : undefined,
      dayOfWeek: parseInt(dayOfWeek),
      periodNumber: parseInt(periodNumber),
      startTime,
      endTime,
      room,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: "Timetable slot created successfully",
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

const getTimetableByClass = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { academicYearId, termId } = req.query;

    const slots = await timetableService.getTimetableByClass(
      parseInt(classId),
      academicYearId ? parseInt(academicYearId) : null,
      termId ? parseInt(termId) : null
    );

    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

const getTimetableByTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { academicYearId, termId } = req.query;

    const slots = await timetableService.getTimetableByTeacher(
      parseInt(teacherId),
      academicYearId ? parseInt(academicYearId) : null,
      termId ? parseInt(termId) : null
    );

    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

const getTimetableBySubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { academicYearId } = req.query;

    const slots = await timetableService.getTimetableBySubject(
      parseInt(subjectId),
      academicYearId ? parseInt(academicYearId) : null
    );

    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

const getAllTimetable = async (req, res, next) => {
  try {
    const { academicYearId, termId } = req.query;

    const slots = await timetableService.getAllTimetable(
      academicYearId ? parseInt(academicYearId) : null,
      termId ? parseInt(termId) : null
    );

    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

const getTimetableById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const slot = await timetableService.getTimetableById(parseInt(id));

    res.json({
      success: true,
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

const updateTimetableSlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      classId, subjectId, teacherId, academicYearId, termId,
      dayOfWeek, periodNumber, startTime, endTime, room, isActive
    } = req.body;

    const slot = await timetableService.updateTimetableSlot(parseInt(id), {
      classId: classId ? parseInt(classId) : undefined,
      subjectId: subjectId ? parseInt(subjectId) : undefined,
      teacherId: teacherId ? parseInt(teacherId) : undefined,
      academicYearId: academicYearId ? parseInt(academicYearId) : undefined,
      termId: termId ? parseInt(termId) : undefined,
      dayOfWeek: dayOfWeek ? parseInt(dayOfWeek) : undefined,
      periodNumber: periodNumber ? parseInt(periodNumber) : undefined,
      startTime,
      endTime,
      room,
      isActive,
    });

    res.json({
      success: true,
      message: "Timetable slot updated successfully",
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTimetableSlot = async (req, res, next) => {
  try {
    const { id } = req.params;

    await timetableService.deleteTimetableSlot(parseInt(id));

    res.json({
      success: true,
      message: "Timetable slot deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const setTeacherAvailability = async (req, res, next) => {
  try {
    const { teacherId, dayOfWeek, periodNumber, isAvailable } = req.body;

    const availability = await timetableService.setTeacherAvailability({
      teacherId: parseInt(teacherId),
      dayOfWeek: parseInt(dayOfWeek),
      periodNumber: parseInt(periodNumber),
      isAvailable,
    });

    res.status(201).json({
      success: true,
      message: "Teacher availability set successfully",
      data: availability,
    });
  } catch (error) {
    next(error);
  }
};

const getTeacherAvailability = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { dayOfWeek } = req.query;

    const availability = await timetableService.getTeacherAvailability(
      parseInt(teacherId),
      dayOfWeek ? parseInt(dayOfWeek) : null
    );

    res.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    next(error);
  }
};

const bulkSetTeacherAvailability = async (req, res, next) => {
  try {
    const { teacherId, availability } = req.body;

    const result = await timetableService.bulkSetTeacherAvailability(
      parseInt(teacherId),
      availability.map(a => ({
        dayOfWeek: parseInt(a.dayOfWeek),
        periodNumber: parseInt(a.periodNumber),
        isAvailable: a.isAvailable
      }))
    );

    res.status(201).json({
      success: true,
      message: "Teacher availability bulk updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const checkTimetableConflicts = async (req, res, next) => {
  try {
    const {
      classId, subjectId, teacherId, academicYearId,
      dayOfWeek, periodNumber, room
    } = req.body;

    const result = await timetableService.checkTimetableConflicts({
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
      teacherId: teacherId ? parseInt(teacherId) : undefined,
      academicYearId: parseInt(academicYearId),
      dayOfWeek: parseInt(dayOfWeek),
      periodNumber: parseInt(periodNumber),
      room,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
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

  checkTimetableConflicts,
};

