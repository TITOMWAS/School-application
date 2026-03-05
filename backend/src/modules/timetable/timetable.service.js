const timetableSql = require("./timetable.sql");
const ApiError = require("../../utils/ApiError");

const createTimetableSlot = async (timetableData) => {
  const {
    classId, subjectId, teacherId, academicYearId, termId,
    dayOfWeek, periodNumber, startTime, endTime, room, isActive
  } = timetableData;

  if (!classId || !subjectId || !academicYearId || dayOfWeek === undefined || !periodNumber || !startTime || !endTime) {
    throw new ApiError(400, "Class ID, subject ID, academic year ID, day of week, period number, start time, and end time are required");
  }

  if (dayOfWeek < 1 || dayOfWeek > 7) {
    throw new ApiError(400, "Day of week must be between 1 (Monday) and 7 (Sunday)");
  }

  if (periodNumber < 1) {
    throw new ApiError(400, "Period number must be at least 1");
  }

  if (startTime >= endTime) {
    throw new ApiError(400, "End time must be after start time");
  }

  const classSql = require("../classes/class.sql");
  const classRecord = await classSql.getClassById(classId);
  if (!classRecord) {
    throw new ApiError(400, "Class not found");
  }

  const subjectSql = require("../users/user.sql");
  const subject = await subjectSql.getSubjectById(subjectId);
  if (!subject) {
    throw new ApiError(400, "Subject not found");
  }

  if (teacherId) {
    const teacher = await subjectSql.findUserById(teacherId);
    if (!teacher || teacher.role !== "teacher") {
      throw new ApiError(400, "Invalid teacher user");
    }
  }

  const conflicts = await checkConflicts(classId, subjectId, teacherId, academicYearId, dayOfWeek, periodNumber, room);
  if (conflicts.length > 0) {
    throw new ApiError(400, "Schedule conflict detected", { conflicts });
  }

  return timetableSql.createTimetableSlot({
    classId, subjectId, teacherId, academicYearId, termId,
    dayOfWeek, periodNumber, startTime, endTime, room, isActive
  });
};

const getTimetableByClass = async (classId, academicYearId = null, termId = null) => {
  const classSql = require("../classes/class.sql");
  const classRecord = await classSql.getClassById(classId);
  if (!classRecord) {
    throw new ApiError(404, "Class not found");
  }

  return timetableSql.getTimetableByClass(classId, academicYearId || classRecord.academic_year_id, termId);
};

const getTimetableByTeacher = async (teacherId, academicYearId = null, termId = null) => {
  const subjectSql = require("../users/user.sql");
  const teacher = await subjectSql.findUserById(teacherId);
  if (!teacher || teacher.role !== "teacher") {
    throw new ApiError(400, "Invalid teacher user");
  }

  return timetableSql.getTimetableByTeacher(teacherId, academicYearId, termId);
};

const getTimetableBySubject = async (subjectId, academicYearId = null) => {
  const subjectSql = require("../users/user.sql");
  const subject = await subjectSql.getSubjectById(subjectId);
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  return timetableSql.getTimetableBySubject(subjectId, academicYearId);
};

const getAllTimetable = async (academicYearId = null, termId = null) => {
  return timetableSql.getAllTimetable(academicYearId, termId);
};

const getTimetableById = async (id) => {
  const slot = await timetableSql.getTimetableById(id);
  if (!slot) {
    throw new ApiError(404, "Timetable slot not found");
  }
  return slot;
};

const updateTimetableSlot = async (id, updates) => {
  const slot = await timetableSql.getTimetableById(id);
  if (!slot) {
    throw new ApiError(404, "Timetable slot not found");
  }

  if (updates.dayOfWeek !== undefined && (updates.dayOfWeek < 1 || updates.dayOfWeek > 7)) {
    throw new ApiError(400, "Day of week must be between 1 (Monday) and 7 (Sunday)");
  }

  if (updates.periodNumber !== undefined && updates.periodNumber < 1) {
    throw new ApiError(400, "Period number must be at least 1");
  }

  const startTime = updates.startTime || slot.start_time;
  const endTime = updates.endTime || slot.end_time;
  if (startTime >= endTime) {
    throw new ApiError(400, "End time must be after start time");
  }

  if (updates.teacherId) {
    const subjectSql = require("../users/user.sql");
    const teacher = await subjectSql.findUserById(updates.teacherId);
    if (!teacher || teacher.role !== "teacher") {
      throw new ApiError(400, "Invalid teacher user");
    }
  }

  const classId = updates.classId || slot.class_id;
  const subjectId = updates.subjectId || slot.subject_id;
  const teacherId = updates.teacherId !== undefined ? updates.teacherId : slot.teacher_id;
  const academicYearId = updates.academicYearId || slot.academic_year_id;
  const dayOfWeek = updates.dayOfWeek !== undefined ? updates.dayOfWeek : slot.day_of_week;
  const periodNumber = updates.periodNumber !== undefined ? updates.periodNumber : slot.period_number;
  const room = updates.room !== undefined ? updates.room : slot.room;

  const conflicts = await checkConflicts(classId, subjectId, teacherId, academicYearId, dayOfWeek, periodNumber, room, id);
  if (conflicts.length > 0) {
    throw new ApiError(400, "Schedule conflict detected", { conflicts });
  }

  return timetableSql.updateTimetableSlot(id, updates);
};

const deleteTimetableSlot = async (id) => {
  const slot = await timetableSql.getTimetableById(id);
  if (!slot) {
    throw new ApiError(404, "Timetable slot not found");
  }

  return timetableSql.deleteTimetableSlot(id);
};

const setTeacherAvailability = async (availabilityData) => {
  const { teacherId, dayOfWeek, periodNumber, isAvailable } = availabilityData;

  if (!teacherId || dayOfWeek === undefined || !periodNumber) {
    throw new ApiError(400, "Teacher ID, day of week, and period number are required");
  }

  if (dayOfWeek < 1 || dayOfWeek > 7) {
    throw new ApiError(400, "Day of week must be between 1 (Monday) and 7 (Sunday)");
  }

  if (periodNumber < 1) {
    throw new ApiError(400, "Period number must be at least 1");
  }

  const subjectSql = require("../users/user.sql");
  const teacher = await subjectSql.findUserById(teacherId);
  if (!teacher || teacher.role !== "teacher") {
    throw new ApiError(400, "Invalid teacher user");
  }

  return timetableSql.setTeacherAvailability({
    teacherId,
    dayOfWeek,
    periodNumber,
    isAvailable
  });
};

const getTeacherAvailability = async (teacherId, dayOfWeek = null) => {
  const subjectSql = require("../users/user.sql");
  const teacher = await subjectSql.findUserById(teacherId);
  if (!teacher || teacher.role !== "teacher") {
    throw new ApiError(400, "Invalid teacher user");
  }

  return timetableSql.getTeacherAvailability(teacherId, dayOfWeek);
};

const bulkSetTeacherAvailability = async (teacherId, availabilityArray) => {
  if (!teacherId || !Array.isArray(availabilityArray) || availabilityArray.length === 0) {
    throw new ApiError(400, "Teacher ID and availability array are required");
  }

  const subjectSql = require("../users/user.sql");
  const teacher = await subjectSql.findUserById(teacherId);
  if (!teacher || teacher.role !== "teacher") {
    throw new ApiError(400, "Invalid teacher user");
  }

  for (const avail of availabilityArray) {
    if (avail.dayOfWeek === undefined || !avail.periodNumber) {
      throw new ApiError(400, "Each availability entry must have day of week and period number");
    }
    if (avail.dayOfWeek < 1 || avail.dayOfWeek > 7) {
      throw new ApiError(400, "Day of week must be between 1 (Monday) and 7 (Sunday)");
    }
    if (avail.periodNumber < 1) {
      throw new ApiError(400, "Period number must be at least 1");
    }
  }

  return timetableSql.bulkSetTeacherAvailability(teacherId, availabilityArray);
};

const checkConflicts = async (classId, subjectId, teacherId, academicYearId, dayOfWeek, periodNumber, room, excludeId = null) => {
  const conflicts = [];

  const classConflicts = await timetableSql.checkClassConflict(classId, academicYearId, dayOfWeek, periodNumber, excludeId);
  if (classConflicts.length > 0) {
    conflicts.push({
      type: 'class_conflict',
      message: 'Class already has a scheduled class at this time',
      existingSlots: classConflicts
    });
  }

  const teacherConflicts = await timetableSql.checkTeacherConflict(teacherId, academicYearId, dayOfWeek, periodNumber, excludeId);
  if (teacherConflicts.length > 0) {
    conflicts.push({
      type: 'teacher_conflict',
      message: 'Teacher is already scheduled at this time',
      existingSlots: teacherConflicts
    });
  }

  const roomConflicts = await timetableSql.checkRoomConflict(room, academicYearId, dayOfWeek, periodNumber, excludeId);
  if (roomConflicts.length > 0) {
    conflicts.push({
      type: 'room_conflict',
      message: 'Room is already occupied at this time',
      existingSlots: roomConflicts
    });
  }

  return conflicts;
};

const checkTimetableConflicts = async (timetableData) => {
  const {
    classId, subjectId, teacherId, academicYearId,
    dayOfWeek, periodNumber, room
  } = timetableData;

  if (!classId || !academicYearId || dayOfWeek === undefined || !periodNumber) {
    throw new ApiError(400, "Class ID, academic year ID, day of week, and period number are required");
  }

  const conflicts = await checkConflicts(classId, subjectId, teacherId, academicYearId, dayOfWeek, periodNumber, room);

  return {
    hasConflicts: conflicts.length > 0,
    conflicts
  };
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

  checkConflicts,
  checkTimetableConflicts,
};

