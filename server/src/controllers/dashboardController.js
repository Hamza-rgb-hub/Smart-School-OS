const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const { FeePayment } = require('../models/Fee');
const ReportCard = require('../models/ReportCard');

// @desc    School admin dashboard stats
// @route   GET /api/dashboard/school
// @access  Private (School Admin)
const getSchoolDashboard = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;

    const [totalStudents, totalTeachers, totalClasses, pendingFees, paidFees] = await Promise.all([
      Student.countDocuments({ schoolId, isActive: true }),
      Teacher.countDocuments({ schoolId, isActive: true }),
      Class.countDocuments({ schoolId, isActive: true }),
      FeePayment.countDocuments({ schoolId, status: 'pending' }),
      FeePayment.countDocuments({ schoolId, status: 'paid' }),
    ]);

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [presentToday, absentToday] = await Promise.all([
      Attendance.countDocuments({ schoolId, date: { $gte: today, $lt: tomorrow }, status: 'present' }),
      Attendance.countDocuments({ schoolId, date: { $gte: today, $lt: tomorrow }, status: 'absent' }),
    ]);

    // Monthly fee collection (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const feeStats = await FeePayment.aggregate([
      { $match: { schoolId: req.user.schoolId, status: 'paid', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$paidAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Recent students (last 5)
    const recentStudents = await Student.find({ schoolId })
      .populate('classId', 'name section')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name profileImage classId admissionDate');

    // Attendance trend (last 7 days)
    const attendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const [present, absent] = await Promise.all([
        Attendance.countDocuments({ schoolId, date: { $gte: date, $lt: nextDay }, status: 'present' }),
        Attendance.countDocuments({ schoolId, date: { $gte: date, $lt: nextDay }, status: 'absent' }),
      ]);

      attendanceTrend.push({
        date: date.toISOString().split('T')[0],
        present,
        absent,
        total: present + absent
      });
    }

    res.json({
      success: true,
      data: {
        stats: { totalStudents, totalTeachers, totalClasses, pendingFees, paidFees },
        attendance: { presentToday, absentToday, total: presentToday + absentToday },
        feeStats,
        recentStudents,
        attendanceTrend
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSchoolDashboard };
