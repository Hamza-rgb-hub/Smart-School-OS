const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    maxlength: [100, 'Class name cannot exceed 100 characters']
  },
  section: {
    type: String,
    trim: true,
    default: 'A'
  },
  grade: {
    type: String,
    trim: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required']
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
  subjects: [{
    name: { type: String, trim: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }
  }],
  maxStudents: {
    type: Number,
    default: 40
  },
  academicYear: {
    type: String,
    default: new Date().getFullYear().toString()
  },
  schedule: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for student count
classSchema.virtual('studentCount', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'classId',
  count: true
});

classSchema.index({ schoolId: 1 });
classSchema.index({ name: 1, section: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
