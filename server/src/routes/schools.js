const express = require('express');
const School = require('../models/School');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

// Get own school profile
router.get('/me', protect, authorize('school_admin'), async (req, res, next) => {
  try {
    const school = await School.findById(req.user.schoolId).populate('adminId', 'name email lastLogin');
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    res.json({ success: true, data: school });
  } catch (error) { next(error); }
});

// Update school profile
router.put('/me', protect, authorize('school_admin'), upload.single('logo'), async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (req.file) updateData.logo = `/uploads/logos/${req.file.filename}`;
    const school = await School.findByIdAndUpdate(req.user.schoolId, updateData, { new: true, runValidators: true });
    res.json({ success: true, message: 'School profile updated', data: school });
  } catch (error) { next(error); }
});

// Public registration (handled by auth/register)
// Get school by ID (super admin)
router.get('/:id', protect, authorize('super_admin'), async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id).populate('adminId', 'name email lastLogin');
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    res.json({ success: true, data: school });
  } catch (error) { next(error); }
});

module.exports = router;
