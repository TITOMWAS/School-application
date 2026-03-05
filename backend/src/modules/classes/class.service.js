const classSql = require("./class.sql");
const ApiError = require("../../utils/ApiError");

const createClass = async (classData) => {
  const { name, academicYearId, level, section, classTeacherId, capacity, isActive } = classData;

  if (!name || !academicYearId || !level) {
    throw new ApiError(400, "Name, academic year, and level are required");
  }

  const existingClass = await classSql.classExistsInYear(academicYearId, level, section);
  if (existingClass) {
    throw new ApiError(400, "Class with this level and section already exists in this academic year");
  }

  if (classTeacherId) {
    const { getUserById } = require("../users/user.sql");
    const teacher = await getUserById(classTeacherId);
    if (!teacher || teacher.role !== "teacher") {
      throw new ApiError(400, "Invalid teacher user");
    }
  }

  if (capacity && capacity < 1) {
    throw new ApiError(400, "Capacity must be at least 1");
  }

  return classSql.createClass({
    name,
    academicYearId,
    level,
    section,
    classTeacherId,
    capacity,
    isActive,
  });
};

const getAllClasses = async (academicYearId = null, activeOnly = false) => {
  if (academicYearId) {
    const academicYearSql = require("../academic-years/academic-year.sql");
    const year = await academicYearSql.getAcademicYearById(academicYearId);
    if (!year) {
      throw new ApiError(404, "Academic year not found");
    }
  }

  return classSql.getAllClasses(academicYearId, activeOnly);
};

const getClassById = async (id) => {
  const classRecord = await classSql.getClassById(id);
  if (!classRecord) {
    throw new ApiError(404, "Class not found");
  }

  const studentCount = await classSql.getClassStudentCount(id, classRecord.academic_year_id);
  
  return {
    ...classRecord,
    student_count: studentCount,
  };
};

const updateClass = async (id, updates) => {
  const classRecord = await classSql.getClassById(id);
  if (!classRecord) {
    throw new ApiError(404, "Class not found");
  }

  const level = updates.level || classRecord.level;
  const section = updates.section !== undefined ? updates.section : classRecord.section;
  const academicYearId = updates.academicYearId || classRecord.academic_year_id;

  const existingClass = await classSql.classExistsInYear(academicYearId, level, section, id);
  if (existingClass) {
    throw new ApiError(400, "Class with this level and section already exists in this academic year");
  }

  if (updates.classTeacherId) {
    const { findUserById } = require("../users/user.sql");
    const teacher = await findUserById(updates.classTeacherId);
    if (!teacher || teacher.role !== "teacher") {
      throw new ApiError(400, "Invalid teacher user");
    }
  }

  if (updates.capacity && updates.capacity < 1) {
    throw new ApiError(400, "Capacity must be at least 1");
  }

  return classSql.updateClass(id, updates);
};

const deleteClass = async (id) => {
  const classRecord = await classSql.getClassById(id);
  if (!classRecord) {
    throw new ApiError(404, "Class not found");
  }

  const studentCount = await classSql.getClassStudentCount(id, classRecord.academic_year_id);
  if (studentCount > 0) {
    throw new ApiError(400, "Cannot delete class with enrolled students. Unenroll students first.");
  }

  const subjects = await classSql.getClassSubjects(id, classRecord.academic_year_id);
  if (subjects && subjects.length > 0) {
    throw new ApiError(400, "Cannot delete class with assigned subjects. Remove subject assignments first.");
  }

  return classSql.deleteClass(id);
};

const assignClassTeacher = async (classId, teacherId) => {
  const classRecord = await classSql.getClassById(classId);
  if (!classRecord) {
    throw new ApiError(404, "Class not found");
  }

  const { findUserById } = require("../users/user.sql");
  const teacher = await findUserById(teacherId);
  if (!teacher || teacher.role !== "teacher") {
    throw new ApiError(400, "Invalid teacher user");
  }

  return classSql.updateClass(classId, { classTeacherId: teacherId });
};

const assignSubjectToClass = async (classSubjectData) => {
  const { classId, subjectId, teacherId, academicYearId } = classSubjectData;

  if (!classId || !subjectId || !academicYearId) {
    throw new ApiError(400, "Class ID, subject ID, and academic year ID are required");
  }

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

  return classSql.assignSubjectToClass({
    classId,
    subjectId,
    teacherId,
    academicYearId,
  });
};

const removeSubjectFromClass = async (classId, subjectId, academicYearId) => {
  const classRecord = await classSql.getClassById(classId);
  if (!classRecord) {
    throw new ApiError(404, "Class not found");
  }

  const subjectSql = require("../users/user.sql");
  const subject = await subjectSql.getSubjectById(subjectId);
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  return classSql.removeSubjectFromClass(classId, subjectId, academicYearId);
};

const getClassSubjects = async (classId, academicYearId = null) => {
  const classRecord = await classSql.getClassById(classId);
  if (!classRecord) {
    throw new ApiError(404, "Class not found");
  }

  return classSql.getClassSubjects(classId, academicYearId || classRecord.academic_year_id);
};

const getSubjectClasses = async (subjectId, academicYearId = null) => {
  const subjectSql = require("../users/user.sql");
  const subject = await subjectSql.getSubjectById(subjectId);
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  return classSql.getSubjectClasses(subjectId, academicYearId);
};

const updateClassSubjectTeacher = async (classId, subjectId, academicYearId, teacherId) => {
  const classRecord = await classSql.getClassById(classId);
  if (!classRecord) {
    throw new ApiError(404, "Class not found");
  }

  const subjectSql = require("../users/user.sql");
  const subject = await subjectSql.getSubjectById(subjectId);
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  if (teacherId) {
    const teacher = await subjectSql.findUserById(teacherId);
    if (!teacher || teacher.role !== "teacher") {
      throw new ApiError(400, "Invalid teacher user");
    }
  }

  return classSql.updateClassSubjectTeacher(classId, subjectId, academicYearId, teacherId);
};

const enrollStudentInClass = async (enrollmentData) => {
  const { classId, studentId, academicYearId } = enrollmentData;

  if (!classId || !studentId || !academicYearId) {
    throw new ApiError(400, "Class ID, student ID, and academic year ID are required");
  }

  const classRecord = await classSql.getClassById(classId);
  if (!classRecord) {
    throw new ApiError(400, "Class not found");
  }

  const studentCount = await classSql.getClassStudentCount(classId, academicYearId);
  if (studentCount >= classRecord.capacity) {
    throw new ApiError(400, "Class is at full capacity");
  }

  const { findUserById } = require("../users/user.sql");
  const student = await findUserById(studentId);
  if (!student || student.role !== "student") {
    throw new ApiError(400, "Invalid student user");
  }

  const isEnrolled = await classSql.isStudentEnrolledInClass(classId, studentId, academicYearId);
  if (isEnrolled) {
    throw new ApiError(400, "Student is already enrolled in this class");
  }

  return classSql.enrollStudentInClass({
    classId,
    studentId,
    academicYearId,
    status: "active",
  });
};

const unenrollStudentFromClass = async (classId, studentId, academicYearId) => {
  const classRecord = await classSql.getClassById(classId);
  if (!classRecord) {
    throw new ApiError(404, "Class not found");
  }

  const { findUserById } = require("../users/user.sql");
  const student = await findUserById(studentId);
  if (!student || student.role !== "student") {
    throw new ApiError(400, "Invalid student user");
  }

  const isEnrolled = await classSql.isStudentEnrolledInClass(classId, studentId, academicYearId);
  if (!isEnrolled) {
    throw new ApiError(400, "Student is not enrolled in this class");
  }

  return classSql.unenrollStudentFromClass(classId, studentId, academicYearId);
};

const getClassStudents = async (classId, academicYearId = null, status = null) => {
  const classRecord = await classSql.getClassById(classId);
  if (!classRecord) {
    throw new ApiError(404, "Class not found");
  }

  return classSql.getClassStudents(classId, academicYearId || classRecord.academic_year_id, status);
};

const getStudentClasses = async (studentId, academicYearId = null) => {
  const { findUserById } = require("../users/user.sql");
  const student = await findUserById(studentId);
  if (!student || student.role !== "student") {
    throw new ApiError(400, "Invalid student user");
  }

  return classSql.getStudentClasses(studentId, academicYearId);
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

