const attendanceService = require("./attendance.service");

const markAttendance = async (req, res, next) => {
  try {
    const { studentId, classId, academicYearId, termId, date, status, periodNumber, subjectId, remarks } = req.body;
    const markedBy = req.user.id;

    const attendance = await attendanceService.markAttendance(
      { studentId, classId, academicYearId, termId, date, status, periodNumber, subjectId, remarks },
      markedBy
    );

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

const bulkMarkAttendance = async (req, res, next) => {
  try {
    const { attendanceArray } = req.body;
    const markedBy = req.user.id;

    const results = await attendanceService.bulkMarkAttendance(attendanceArray, markedBy);

    res.status(201).json({
      success: true,
      message: `${results.length} attendance records marked successfully`,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

const getAttendanceByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { academicYearId, termId, startDate, endDate } = req.query;

    const attendance = await attendanceService.getAttendanceByStudent(
      studentId,
      academicYearId || null,
      termId || null,
      startDate || null,
      endDate || null
    );

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

const getAttendanceByClass = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { academicYearId, termId, date, subjectId } = req.query;

    const attendance = await attendanceService.getAttendanceByClass(
      classId,
      academicYearId || null,
      termId || null,
      date || null,
      subjectId || null
    );

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

const getAttendanceByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const { classId, academicYearId } = req.query;

    const attendance = await attendanceService.getAttendanceByDate(date, classId || null, academicYearId || null);

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

const getAttendanceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const attendance = await attendanceService.getAttendanceById(id);

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

const updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, periodNumber, subjectId, remarks } = req.body;

    const attendance = await attendanceService.updateAttendance(id, {
      status,
      periodNumber,
      subjectId,
      remarks
    });

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

const deleteAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;

    const attendance = await attendanceService.deleteAttendance(id);

    res.status(200).json({
      success: true,
      message: "Attendance deleted successfully",
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

const lockAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lockedBy = req.user.id;

    const attendance = await attendanceService.lockAttendance(id, lockedBy);

    res.status(200).json({
      success: true,
      message: "Attendance locked successfully",
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

const unlockAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lockedBy = req.user.id;

    const attendance = await attendanceService.unlockAttendance(id, lockedBy);

    res.status(200).json({
      success: true,
      message: "Attendance unlocked successfully",
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

const lockClassAttendance = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { date } = req.body;
    const lockedBy = req.user.id;

    const results = await attendanceService.lockClassAttendance(classId, date, lockedBy);

    res.status(200).json({
      success: true,
      message: `${results.length} attendance records locked successfully`,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

const unlockClassAttendance = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { date } = req.body;
    const lockedBy = req.user.id;

    const results = await attendanceService.unlockClassAttendance(classId, date, lockedBy);

    res.status(200).json({
      success: true,
      message: `${results.length} attendance records unlocked successfully`,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

const getClassAttendanceSummary = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { academicYearId, termId, startDate, endDate } = req.query;

    const summary = await attendanceService.getClassAttendanceSummary(
      classId,
      academicYearId || null,
      termId || null,
      startDate || null,
      endDate || null
    );

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

const getStudentAttendanceSummary = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { academicYearId, termId } = req.query;

    const summary = await attendanceService.getStudentAttendanceSummary(
      studentId,
      academicYearId || null,
      termId || null
    );

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

const getAttendanceStats = async (req, res, next) => {
  try {
    const { academicYearId, termId, classId, startDate, endDate } = req.query;

    const stats = await attendanceService.getAttendanceStats(
      academicYearId || null,
      termId || null,
      classId || null,
      startDate || null,
      endDate || null
    );

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

const getStudentsWithoutAttendance = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    const students = await attendanceService.getStudentsWithoutAttendance(classId, date);

    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    next(error);
  }
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

