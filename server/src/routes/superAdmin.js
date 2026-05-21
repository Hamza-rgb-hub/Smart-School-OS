const express = require('express');
const { getAnalytics, getAllSchools, approveSchool, rejectSchool, suspendSchool, deleteSchool, getAllUsers, toggleUserStatus } = require('../controllers/superAdminController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect, authorize('super_admin'));
router.get('/analytics', getAnalytics);
router.get('/schools', getAllSchools);
router.put('/schools/:id/approve', approveSchool);
router.put('/schools/:id/reject', rejectSchool);
router.put('/schools/:id/suspend', suspendSchool);
router.delete('/schools/:id', deleteSchool);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);

module.exports = router;
