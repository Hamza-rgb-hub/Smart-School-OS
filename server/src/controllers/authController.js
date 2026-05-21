const { validationResult } = require('express-validator');
const User = require('../models/User');
const School = require('../models/School');
const { sendTokenResponse } = require('../utils/jwt');

// @desc    Register school + admin account
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email, password, schoolName, schoolEmail, schoolPhone, schoolAddress } = req.body;

    // Check if user email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Check if school email already exists
    const existingSchool = await School.findOne({ email: schoolEmail });
    if (existingSchool) {
      return res.status(400).json({ success: false, message: 'A school with this email already exists.' });
    }

    // Create school (pending status)
    const school = await School.create({
      name: schoolName,
      email: schoolEmail,
      phone: schoolPhone,
      address: schoolAddress,
      status: 'pending'
    });

    // Create school admin user
    const user = await User.create({
      name,
      email,
      password,
      role: 'school_admin',
      schoolId: school._id
    });

    // Update school with admin reference
    school.adminId = user._id;
    await school.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your school is pending approval. You will be notified once approved.',
      data: { schoolId: school._id, status: school.status }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated. Contact support.' });
    }

    // For school admin, check school status
    if (user.role === 'school_admin') {
      const school = await School.findById(user.schoolId);
      if (!school) {
        return res.status(401).json({ success: false, message: 'Associated school not found.' });
      }
      if (school.status === 'pending') {
        return res.status(403).json({ success: false, message: 'Your school registration is pending approval.' });
      }
      if (school.status === 'rejected') {
        return res.status(403).json({ success: false, message: `Your school registration was rejected. Reason: ${school.rejectionReason || 'Contact support.'}` });
      }
      if (school.status === 'suspended') {
        return res.status(403).json({ success: false, message: 'Your school has been suspended. Contact support.' });
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('schoolId', 'name logo status email');
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    sendTokenResponse(user, 200, res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
