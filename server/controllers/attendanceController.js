const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

const markAttendance = async (req, res, next) => {
  try {
    const { classId, date, records } = req.body;
    const schoolId = req.user.schoolId;

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const ops = records.map(record => ({
      updateOne: {
        filter: { studentId: record.studentId, date: attendanceDate },
        update: { $set: { studentId: record.studentId, classId, schoolId, date: attendanceDate, status: record.status, markedBy: req.user._id, remarks: record.remarks } },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(ops);
    res.json({ success: true, message: `Attendance marked for ${records.length} students` });
  } catch (error) { next(error); }
};

const getAttendanceByClass = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;
    const schoolId = req.user.schoolId;

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const students = await Student.find({ classId, schoolId, isActive: true }).select('name rollNumber profileImage');
    const attendance = await Attendance.find({ classId, schoolId, date: { $gte: attendanceDate, $lt: nextDay } });

    const attendanceMap = {};
    attendance.forEach(a => { attendanceMap[a.studentId.toString()] = a.status; });

    const result = students.map(s => ({
      studentId: s._id,
      name: s.name,
      rollNumber: s.rollNumber,
      profileImage: s.profileImage,
      status: attendanceMap[s._id.toString()] || 'not_marked'
    }));

    res.json({ success: true, date: attendanceDate, data: result });
  } catch (error) { next(error); }
};

const getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;
    const schoolId = req.user.schoolId;

    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const records = await Attendance.find({ studentId, schoolId, date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 });

    const summary = {
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      excused: records.filter(r => r.status === 'excused').length,
      total: records.length
    };
    summary.percentage = summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;

    res.json({ success: true, data: records, summary });
  } catch (error) { next(error); }
};

module.exports = { markAttendance, getAttendanceByClass, getStudentAttendance };
