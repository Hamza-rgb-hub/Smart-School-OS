const { validationResult } = require('express-validator');
const Student = require('../models/Student');
const { paginate } = require('../utils/paginate');
const fs = require('fs');
const path = require('path');

// @desc    Get all students for a school
// @route   GET /api/students
// @access  Private (School Admin)
const getStudents = async (req, res, next) => {
  try {
    const schoolId = req.user.role === 'super_admin' ? req.query.schoolId : req.user.schoolId;
    if (!schoolId) return res.status(400).json({ success: false, message: 'School ID required' });

    const { page = 1, limit = 10, search = '', classId, status } = req.query;

    const query = { schoolId };
    if (classId) query.classId = classId;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const result = await paginate(Student, query, {
      page, limit,
      sort: { createdAt: -1 },
      populate: [
        { path: 'classId', select: 'name section' }
      ]
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
const getStudent = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'super_admin') query.schoolId = req.user.schoolId;

    const student = await Student.findOne(query).populate('classId', 'name section grade');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

// @desc    Create student
// @route   POST /api/students
// @access  Private (School Admin)
const createStudent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const schoolId = req.user.schoolId;
    const studentData = { ...req.body, schoolId };

    if (req.file) {
      studentData.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    const student = await Student.create(studentData);
    const populated = await student.populate('classId', 'name section');

    res.status(201).json({ success: true, message: 'Student created successfully', data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (School Admin)
const updateStudent = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'super_admin') query.schoolId = req.user.schoolId;

    let student = await Student.findOne(query);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Handle image update
    if (req.file) {
      if (student.profileImage) {
        const oldPath = path.join(__dirname, '..', student.profileImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      req.body.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    }).populate('classId', 'name section');

    res.json({ success: true, message: 'Student updated successfully', data: student });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (School Admin)
const deleteStudent = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'super_admin') query.schoolId = req.user.schoolId;

    const student = await Student.findOne(query);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    if (student.profileImage) {
      const imgPath = path.join(__dirname, '..', student.profileImage);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await Student.deleteOne({ _id: student._id });
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get students by class
// @route   GET /api/students/class/:classId
// @access  Private
const getStudentsByClass = async (req, res, next) => {
  try {
    const query = { classId: req.params.classId, isActive: true };
    if (req.user.role !== 'super_admin') query.schoolId = req.user.schoolId;

    const students = await Student.find(query).sort({ name: 1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent, getStudentsByClass };
