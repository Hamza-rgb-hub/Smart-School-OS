const express = require('express');
const { markAttendance, getAttendanceByClass, getStudentAttendance } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();
router.use(protect, authorize('school_admin'));
router.post('/mark', markAttendance);
router.get('/class/:classId', getAttendanceByClass);
router.get('/student/:studentId', getStudentAttendance);
module.exports = router;
