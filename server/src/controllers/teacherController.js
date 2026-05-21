const { validationResult } = require('express-validator');
const Teacher = require('../models/Teacher');
const { paginate } = require('../utils/paginate');

const getTeachers = async (req, res, next) => {
  try {
    const schoolId = req.user.role === 'super_admin' ? req.query.schoolId : req.user.schoolId;
    if (!schoolId) return res.status(400).json({ success: false, message: 'School ID required' });

    const { page = 1, limit = 10, search = '', subject } = req.query;
    const query = { schoolId };

    if (subject) query.subjects = { $in: [subject] };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subjects: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const result = await paginate(Teacher, query, {
      page, limit,
      sort: { createdAt: -1 },
      populate: { path: 'classes', select: 'name section' }
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getTeacher = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'super_admin') query.schoolId = req.user.schoolId;

    const teacher = await Teacher.findOne(query).populate('classes', 'name section');
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    res.json({ success: true, data: teacher });
  } catch (error) {
    next(error);
  }
};

const createTeacher = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const schoolId = req.user.schoolId;
    const teacherData = { ...req.body, schoolId };

    if (req.file) teacherData.profileImage = `/uploads/profiles/${req.file.filename}`;
    if (req.body.subjects && typeof req.body.subjects === 'string') {
      teacherData.subjects = req.body.subjects.split(',').map(s => s.trim()).filter(Boolean);
    }

    const teacher = await Teacher.create(teacherData);
    res.status(201).json({ success: true, message: 'Teacher created successfully', data: teacher });
  } catch (error) {
    next(error);
  }
};

const updateTeacher = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'super_admin') query.schoolId = req.user.schoolId;

    let teacher = await Teacher.findOne(query);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    if (req.file) req.body.profileImage = `/uploads/profiles/${req.file.filename}`;
    if (req.body.subjects && typeof req.body.subjects === 'string') {
      req.body.subjects = req.body.subjects.split(',').map(s => s.trim()).filter(Boolean);
    }

    teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, message: 'Teacher updated successfully', data: teacher });
  } catch (error) {
    next(error);
  }
};

const deleteTeacher = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'super_admin') query.schoolId = req.user.schoolId;

    const teacher = await Teacher.findOne(query);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    await Teacher.deleteOne({ _id: teacher._id });
    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getAllTeachersSimple = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    const teachers = await Teacher.find({ schoolId, isActive: true }).select('name subjects').sort({ name: 1 });
    res.json({ success: true, data: teachers });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher, getAllTeachersSimple };
