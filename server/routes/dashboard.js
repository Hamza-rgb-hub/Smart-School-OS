// routes/dashboard.js
const express = require('express');
const { getSchoolDashboard } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();
router.get('/school', protect, authorize('school_admin'), getSchoolDashboard);
module.exports = router;
