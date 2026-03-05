const classService = require("./class.service");

const createClass = async (req, res, next) => {
  try {
    const { name, academicYearId, level, section, classTeacherId, capacity, isActive } = req.body;

    const classRecord = await classService.createClass({
      name,
      academicYearId: parseInt(academicYearId),
      level,
      section,
      classTeacherId: classTeacherId ? parseInt(classTeacherId) : undefined,
      capacity: capacity ? parseInt(capacity) : undefined,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: classRecord,
    });
  } catch (error) {
    next(error);
  }
};

const getAllClasses = async (req, res, next) => {
  try {
    const { academicYearId, activeOnly = false } = req.query;

    const classes = await classService.getAllClasses(
      academicYearId ? parseInt(academicYearId) : null,
      activeOnly !== "false"
    );

    res.json({
      success: true,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
};

const getClassById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const classRecord = await classService.getClassById(parseInt(id));

    res.json({
      success: true,
      data: classRecord,
    });
  } catch (error) {
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, academicYearId, level, section, classTeacherId, capacity, isActive } = req.body;

    const classRecord = await classService.updateClass(parseInt(id), {
      name,
      academicYearId: academicYearId ? parseInt(academicYearId) : undefined,
      level,
      section,
      classTeacherId: classTeacherId ? parseInt(classTeacherId) : undefined,
      capacity: capacity ? parseInt(capacity) : undefined,
      isActive,
    });

    res.json({
      success: true,
      message: "Class updated successfully",
      data: classRecord,
    });
  } catch (error) {
    next(error);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    const { id } = req.params;

    await classService.deleteClass(parseInt(id));

    res.json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const assignClassTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { teacherId } = req.body;

    const classRecord = await classService.assignClassTeacher(
      parseInt(id),
      parseInt(teacherId)
    );

    res.json({
      success: true,
      message: "Class teacher assigned successfully",
      data: classRecord,
    });
  } catch (error) {
    next(error);
  }
};

const assignSubjectToClass = async (req, res, next) => {
  try {
    const { classId, subjectId, teacherId, academicYearId } = req.body;

    const classSubject = await classService.assignSubjectToClass({
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
      teacherId: teacherId ? parseInt(teacherId) : undefined,
      academicYearId: parseInt(academicYearId),
    });

    res.status(201).json({
      success: true,
      message: "Subject assigned to class successfully",
      data: classSubject,
    });
  } catch (error) {
    next(error);
  }
};

const removeSubjectFromClass = async (req, res, next) => {
  try {
    const { classId, subjectId, academicYearId } = req.params;

    await classService.removeSubjectFromClass(
      parseInt(classId),
      parseInt(subjectId),
      parseInt(academicYearId)
    );

    res.json({
      success: true,
      message: "Subject removed from class successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getClassSubjects = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { academicYearId } = req.query;

    const subjects = await classService.getClassSubjects(
      parseInt(classId),
      academicYearId ? parseInt(academicYearId) : null
    );

    res.json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

const getSubjectClasses = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { academicYearId } = req.query;

    const classes = await classService.getSubjectClasses(
      parseInt(subjectId),
      academicYearId ? parseInt(academicYearId) : null
    );

    res.json({
      success: true,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
};

const updateClassSubjectTeacher = async (req, res, next) => {
  try {
    const { classId, subjectId, academicYearId } = req.params;
    const { teacherId } = req.body;

    const classSubject = await classService.updateClassSubjectTeacher(
      parseInt(classId),
      parseInt(subjectId),
      parseInt(academicYearId),
      teacherId ? parseInt(teacherId) : null
    );

    res.json({
      success: true,
      message: "Class subject teacher updated successfully",
      data: classSubject,
    });
  } catch (error) {
    next(error);
  }
};

const enrollStudentInClass = async (req, res, next) => {
  try {
    const { classId, studentId, academicYearId } = req.body;

    const enrollment = await classService.enrollStudentInClass({
      classId: parseInt(classId),
      studentId: parseInt(studentId),
      academicYearId: parseInt(academicYearId),
    });

    res.status(201).json({
      success: true,
      message: "Student enrolled successfully",
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};

const unenrollStudentFromClass = async (req, res, next) => {
  try {
    const { classId, studentId, academicYearId } = req.params;

    await classService.unenrollStudentFromClass(
      parseInt(classId),
      parseInt(studentId),
      parseInt(academicYearId)
    );

    res.json({
      success: true,
      message: "Student unenrolled successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getClassStudents = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { academicYearId, status } = req.query;

    const students = await classService.getClassStudents(
      parseInt(classId),
      academicYearId ? parseInt(academicYearId) : null,
      status
    );

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

const getStudentClasses = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { academicYearId } = req.query;

    const classes = await classService.getStudentClasses(
      parseInt(studentId),
      academicYearId ? parseInt(academicYearId) : null
    );

    res.json({
      success: true,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  assignClassTeacher,
  assignSubjectToClass,
  removeSubjectFromClass,
  getClassSubjects,
  getSubjectClasses,
  updateClassSubjectTeacher,
  enrollStudentInClass,
  unenrollStudentFromClass,
  getClassStudents,
  getStudentClasses,
};

