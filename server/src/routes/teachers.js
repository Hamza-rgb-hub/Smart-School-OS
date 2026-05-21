const express = require('express');
const { body } = require('express-validator');
const { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher, getAllTeachersSimple } = require('../controllers/teacherController');
const { protect, authorize, schoolIsolation } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

const teacherValidation = [
  body('name').trim().notEmpty().withMessage('Teacher name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
];

router.use(protect, authorize('school_admin', 'super_admin'), schoolIsolation);
router.get('/all', getAllTeachersSimple);
router.get('/', getTeachers);
router.get('/:id', getTeacher);
router.post('/', upload.single('profileImage'), teacherValidation, createTeacher);
router.put('/:id', upload.single('profileImage'), updateTeacher);
router.delete('/:id', deleteTeacher);

module.exports = router;
