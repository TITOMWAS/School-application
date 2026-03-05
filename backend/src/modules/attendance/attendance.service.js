const attendanceSql = require("./attendance.sql");
const ApiError = require("../../utils/ApiError");

const markAttendance = async (attendanceData, markedBy) => {
  const {
    studentId, classId, academicYearId, termId, date, status,
    periodNumber, subjectId, remarks
  } = attendanceData;

  if (!studentId || !classId || !academicYearId || !date || !status) {
    throw new ApiError(400, "Student ID, class ID, academic year ID, date, and status are required");
  }

  const validStatuses = ['present', 'absent', 'late', 'excused'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Status must be one of: present, absent, late, excused");
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new ApiError(400, "Date must be in YYYY-MM-DD format");
  }

  const userSql = require("../users/user.sql");
  const student = await userSql.findUserById(studentId);
  if (!student || student.role !== 'student') {
    throw new ApiError(400, "Invalid student user");
  }

  const classSql = require("../classes/class.sql");
  const classRecord = await classSql.getClassById(classId);
  if (!classRecord) {
    throw new ApiError(400, "Class not found");
  }

  if (markedBy) {
    const teacher = await userSql.findUserById(markedBy);
    if (!teacher || teacher.role !== 'teacher') {
      throw new ApiError(400, "Invalid teacher user");
    }
  }

  return attendanceSql.markAttendance({
    studentId,
    classId,
    academicYearId,
    termId,
    date,
    status,
    periodNumber,
    subjectId,
    markedBy,
    remarks
  });
};

const bulkMarkAttendance = async (attendanceArray, markedBy) => {
  if (!Array.isArray(attendanceArray) || attendanceArray.length === 0) {
    throw new ApiError(400, "Attendance array is required");
  }

  const validStatuses = ['present', 'absent', 'late', 'excused'];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  for (const attendance of attendanceArray) {
    if (!attendance.studentId || !attendance.classId || !attendance.academicYearId || !attendance.date || !attendance.status) {
      throw new ApiError(400, "Each attendance entry must have student ID, class ID, academic year ID, date, and status");
    }

    if (!validStatuses.includes(attendance.status)) {
      throw new ApiError(400, "Status must be one of: present, absent, late, excused");
    }

    if (!dateRegex.test(attendance.date)) {
      throw new ApiError(400, "Date must be in YYYY-MM-DD format");
    }
  }

  return attendanceSql.bulkMarkAttendance(attendanceArray, markedBy);
};

const getAttendanceByStudent = async (studentId, academicYearId = null, termId = null, startDate = null, endDate = null) => {
  const userSql = require("../users/user.sql");
  const student = await userSql.findUserById(studentId);
  if (!student || student.role !== 'student') {
    throw new ApiError(400, "Invalid student user");
  }

  return attendanceSql.getAttendanceByStudent(studentId, academicYearId, termId, startDate, endDate);
};

const getAttendanceByClass = async (classId, academicYearId = null, termId = null, date = null, subjectId = null) => {
  const classSql = require("../classes/class.sql");
  const classRecord = await classSql.getClassById(classId);
  if (!classRecord) {
    throw new ApiError(400, "Class not found");
  }

  return attendanceSql.getAttendanceByClass(classId, academicYearId, termId, date, subjectId);
};

const getAttendanceByDate = async (date, classId = null, academicYearId = null) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new ApiError(400, "Date must be in YYYY-MM-DD format");
  }

  if (classId) {
    const classSql = require("../classes/class.sql");
    const classRecord = await classSql.getClassById(classId);
    if (!classRecord) {
      throw new ApiError(400, "Class not found");
    }
  }

  return attendanceSql.getAttendanceByDate(date, classId, academicYearId);
};

const getAttendanceById = async (id) => {
  const attendance = await attendanceSql.getAttendanceById(id);
  if (!attendance) {
    throw new ApiError(404, "Attendance record not found");
  }
  return attendance;
};

const updateAttendance = async (id, updates) => {
  const attendance = await attendanceSql.getAttendanceById(id);
  if (!attendance) {
    throw new ApiError(404, "Attendance record not found");
  }

  if (attendance.is_locked) {
    throw new ApiError(400, "Cannot update locked attendance record");
  }

  if (updates.status) {
    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(updates.status)) {
      throw new ApiError(400, "Status must be one of: present, absent, late, excused");
    }
  }

  return attendanceSql.updateAttendance(id, updates);
};

const deleteAttendance = async (id) => {
  const attendance = await attendanceSql.getAttendanceById(id);
  if (!attendance) {
    throw new ApiError(404, "Attendance record not found");
  }

  if (attendance.is_locked) {
    throw new ApiError(400, "Cannot delete locked attendance record");
  }

  return attendanceSql.deleteAttendance(id);
};

const lockAttendance = async (id, lockedBy) => {
  const attendance = await attendanceSql.getAttendanceById(id);
  if (!attendance) {
    throw new ApiError(404, "Attendance record not found");
  }

  if (attendance.is_locked) {
    throw new ApiError(400, "Attendance record is already locked");
  }

  const userSql = require("../users/user.sql");
  const user = await userSql.findUserById(lockedBy);
  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
    throw new ApiError(403, "Only admins and teachers can lock attendance");
  }

  return attendanceSql.lockAttendance(id, lockedBy);
};

const unlockAttendance = async (id, lockedBy) => {
  const attendance = await attendanceSql.getAttendanceById(id);
  if (!attendance) {
    throw new ApiError(404, "Attendance record not found");
  }

  if (!attendance.is_locked) {
    throw new ApiError(400, "Attendance record is not locked");
  }

  const userSql = require("../users/user.sql");
  const user = await userSql.findUserById(lockedBy);
  if (!user || user.role !== 'admin') {
    throw new ApiError(403, "Only admins can unlock attendance");
  }

  return attendanceSql.unlockAttendance(id);
};

const lockClassAttendance = async (classId, date, lockedBy) => {
  const classSql = require("../classes/class.sql");
  const classRecord = await classSql.getClassById(classId);
  if (!classRecord) {
    throw new ApiError(400, "Class not found");
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new ApiError(400, "Date must be in YYYY-MM-DD format");
  }

  const userSql = require("../users/user.sql");
  const user = await userSql.findUserById(lockedBy);
  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
    throw new ApiError(403, "Only admins and teachers can lock attendance");
  }

  return attendanceSql.lockClassAttendance(classId, date, lockedBy);
};

const unlockClassAttendance = async (classId, date, lockedBy) => {
  const classSql = require("../classes/class.sql");
  const classRecord = await classSql.getClassById(classId);
  if (!classRecord) {
    throw new ApiError(400, "Class not found");
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new ApiError(400, "Date must be in YYYY-MM-DD format");
  }

  const userSql = require("../users/user.sql");
  const user = await userSql.findUserById(lockedBy);
  if (!user || user.role !== 'admin') {
    throw new ApiError(403, "Only admins can unlock attendance");
  }

  return attendanceSql.unlockClassAttendance(classId, date);
};

const getClassAttendanceSummary = async (classId, academicYearId = null, termId = null, startDate = null, endDate = null) => {
  const classSql = require("../classes/class.sql");
  const classRecord = await classSql.getClassById(classId);
  if (!classRecord) {
    throw new ApiError(400, "Class not found");
  }

  return attendanceSql.getClassAttendanceSummary(classId, academicYearId, termId, startDate, endDate);
};

const getStudentAttendanceSummary = async (studentId, academicYearId = null, termId = null) => {
  const userSql = require("../users/user.sql");
  const student = await userSql.findUserById(studentId);
  if (!student || student.role !== 'student') {
    throw new ApiError(400, "Invalid student user");
  }

  return attendanceSql.getStudentAttendanceSummary(studentId, academicYearId, termId);
};

const getAttendanceStats = async (academicYearId = null, termId = null, classId = null, startDate = null, endDate = null) => {
  if (classId) {
    const classSql = require("../classes/class.sql");
    const classRecord = await classSql.getClassById(classId);
    if (!classRecord) {
      throw new ApiError(400, "Class not found");
    }
  }

  return attendanceSql.getAttendanceStats(academicYearId, termId, classId, startDate, endDate);
};

const getStudentsWithoutAttendance = async (classId, date) => {
  const classSql = require("../classes/class.sql");
  const classRecord = await classSql.getClassById(classId);
  if (!classRecord) {
    throw new ApiError(400, "Class not found");
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new ApiError(400, "Date must be in YYYY-MM-DD format");
  }

  return attendanceSql.getStudentsWithoutAttendance(classId, date);
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

