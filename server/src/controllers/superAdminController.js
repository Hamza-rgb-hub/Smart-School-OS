const School = require('../models/School');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { paginate } = require('../utils/paginate');

// @desc    Get platform-wide analytics
// @route   GET /api/super-admin/analytics
// @access  Super Admin
const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalSchools, pendingSchools, approvedSchools, suspendedSchools,
      totalUsers, totalStudents, totalTeachers
    ] = await Promise.all([
      School.countDocuments(),
      School.countDocuments({ status: 'pending' }),
      School.countDocuments({ status: 'approved' }),
      School.countDocuments({ status: 'suspended' }),
      User.countDocuments({ role: 'school_admin' }),
      Student.countDocuments(),
      Teacher.countDocuments()
    ]);

    // Monthly registrations (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRegistrations = await School.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Schools by status for pie chart
    const schoolsByStatus = [
      { status: 'approved', count: approvedSchools },
      { status: 'pending', count: pendingSchools },
      { status: 'suspended', count: suspendedSchools },
      { status: 'rejected', count: await School.countDocuments({ status: 'rejected' }) }
    ];

    // Recent schools
    const recentSchools = await School.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email status createdAt logo');

    res.json({
      success: true,
      data: {
        stats: { totalSchools, pendingSchools, approvedSchools, suspendedSchools, totalUsers, totalStudents, totalTeachers },
        monthlyRegistrations,
        schoolsByStatus,
        recentSchools
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all schools
// @route   GET /api/super-admin/schools
// @access  Super Admin
const getAllSchools = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const result = await paginate(School, query, {
      page, limit,
      sort: { createdAt: -1 },
      populate: { path: 'adminId', select: 'name email lastLogin' }
    });

    // Add counts
    const schoolsWithCounts = await Promise.all(result.data.map(async (school) => {
      const [studentCount, teacherCount] = await Promise.all([
        Student.countDocuments({ schoolId: school._id }),
        Teacher.countDocuments({ schoolId: school._id })
      ]);
      return { ...school.toObject(), studentCount, teacherCount };
    }));

    res.json({ success: true, data: schoolsWithCounts, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve school
// @route   PUT /api/super-admin/schools/:id/approve
// @access  Super Admin
const approveSchool = async (req, res, next) => {
  try {
    const school = await School.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedAt: new Date(), approvedBy: req.user._id, rejectionReason: null },
      { new: true }
    ).populate('adminId', 'name email');

    if (!school) return res.status(404).json({ success: false, message: 'School not found' });

    res.json({ success: true, message: `School "${school.name}" has been approved.`, data: school });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject school
// @route   PUT /api/super-admin/schools/:id/reject
// @access  Super Admin
const rejectSchool = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason || 'Application did not meet requirements.' },
      { new: true }
    );

    if (!school) return res.status(404).json({ success: false, message: 'School not found' });

    res.json({ success: true, message: `School "${school.name}" has been rejected.`, data: school });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend school
// @route   PUT /api/super-admin/schools/:id/suspend
// @access  Super Admin
const suspendSchool = async (req, res, next) => {
  try {
    const school = await School.findByIdAndUpdate(
      req.params.id,
      { status: 'suspended' },
      { new: true }
    );
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });

    // Deactivate school admin
    await User.updateMany({ schoolId: school._id }, { isActive: false });

    res.json({ success: true, message: `School "${school.name}" has been suspended.`, data: school });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete school
// @route   DELETE /api/super-admin/schools/:id
// @access  Super Admin
const deleteSchool = async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });

    // Delete all associated data
    await Promise.all([
      Student.deleteMany({ schoolId: school._id }),
      Teacher.deleteMany({ schoolId: school._id }),
      User.deleteMany({ schoolId: school._id }),
    ]);

    await School.deleteOne({ _id: school._id });
    res.json({ success: true, message: `School "${school.name}" and all associated data deleted.` });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (school admins)
// @route   GET /api/super-admin/users
// @access  Super Admin
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = { role: 'school_admin' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const result = await paginate(User, query, {
      page, limit,
      sort: { createdAt: -1 },
      populate: { path: 'schoolId', select: 'name status' }
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/super-admin/users/:id/toggle
// @access  Super Admin
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: user.isActive }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics, getAllSchools, approveSchool, rejectSchool, suspendSchool, deleteSchool, getAllUsers, toggleUserStatus };
