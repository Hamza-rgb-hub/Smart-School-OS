const { validationResult } = require('express-validator');
const Class = require('../models/Class');
const Student = require('../models/Student');

const getClasses = async (req, res, next) => {
  try {
    const schoolId = req.user.role === 'super_admin' ? req.query.schoolId : req.user.schoolId;
    if (!schoolId) return res.status(400).json({ success: false, message: 'School ID required' });

    const classes = await Class.find({ schoolId, isActive: true })
      .populate('classTeacher', 'name email')
      .sort({ name: 1, section: 1 });

    // Add student counts
    const classesWithCount = await Promise.all(classes.map(async (cls) => {
      const studentCount = await Student.countDocuments({ classId: cls._id, isActive: true });
      return { ...cls.toObject(), studentCount };
    }));

    res.json({ success: true, count: classesWithCount.length, data: classesWithCount });
  } catch (error) {
    next(error);
  }
};

const getClass = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'super_admin') query.schoolId = req.user.schoolId;

    const cls = await Class.findOne(query)
      .populate('classTeacher', 'name email subjects')
      .populate('subjects.teacher', 'name');

    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    const studentCount = await Student.countDocuments({ classId: cls._id, isActive: true });
    res.json({ success: true, data: { ...cls.toObject(), studentCount } });
  } catch (error) {
    next(error);
  }
};

const createClass = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const schoolId = req.user.schoolId;
    const cls = await Class.create({ ...req.body, schoolId });

    res.status(201).json({ success: true, message: 'Class created successfully', data: cls });
  } catch (error) {
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'super_admin') query.schoolId = req.user.schoolId;

    const cls = await Class.findOneAndUpdate(query, req.body, { new: true, runValidators: true })
      .populate('classTeacher', 'name email');

    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    res.json({ success: true, message: 'Class updated successfully', data: cls });
  } catch (error) {
    next(error);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'super_admin') query.schoolId = req.user.schoolId;

    const cls = await Class.findOne(query);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    const studentCount = await Student.countDocuments({ classId: cls._id });
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete class with ${studentCount} assigned students. Reassign or remove students first.`
      });
    }

    await Class.deleteOne({ _id: cls._id });
    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getClasses, getClass, createClass, updateClass, deleteClass };
