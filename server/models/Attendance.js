const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'present'
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  remarks: String
}, {
  timestamps: true
});

// Prevent duplicate attendance for same student on same date
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ classId: 1, date: 1 });
attendanceSchema.index({ schoolId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
