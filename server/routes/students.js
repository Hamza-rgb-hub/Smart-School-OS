// routes/students.js
const express = require('express');
const { body } = require('express-validator');
const { getStudents, getStudent, createStudent, updateStudent, deleteStudent, getStudentsByClass } = require('../controllers/studentController');
const { protect, authorize, schoolIsolation } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

const studentValidation = [
  body('name').trim().notEmpty().withMessage('Student name is required'),
];

router.use(protect, authorize('school_admin', 'super_admin'), schoolIsolation);
router.get('/', getStudents);
router.get('/class/:classId', getStudentsByClass);
router.get('/:id', getStudent);
router.post('/', upload.single('profileImage'), studentValidation, createStudent);
router.put('/:id', upload.single('profileImage'), updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;
