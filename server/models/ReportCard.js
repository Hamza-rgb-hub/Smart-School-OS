const mongoose = require('mongoose');

const reportCardSchema = new mongoose.Schema({
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
  academicYear: {
    type: String,
    required: true
  },
  term: {
    type: String,
    enum: ['term1', 'term2', 'term3', 'final', 'mid-term'],
    required: true
  },
  subjects: [{
    name: { type: String, required: true },
    marksObtained: { type: Number, min: 0, required: true },
    totalMarks: { type: Number, min: 0, default: 100 },
    grade: String,
    remarks: String
  }],
  totalMarks: { type: Number, default: 0 },
  obtainedMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  grade: { type: String },
  position: { type: Number },
  remarks: String,
  isPublished: { type: Boolean, default: false },
  publishedAt: Date
}, {
  timestamps: true
});

// Calculate totals before saving
reportCardSchema.pre('save', function(next) {
  if (this.subjects && this.subjects.length > 0) {
    this.totalMarks = this.subjects.reduce((sum, s) => sum + (s.totalMarks || 100), 0);
    this.obtainedMarks = this.subjects.reduce((sum, s) => sum + (s.marksObtained || 0), 0);
    this.percentage = this.totalMarks > 0 ? Math.round((this.obtainedMarks / this.totalMarks) * 100) : 0;
    
    // Calculate grade
    if (this.percentage >= 90) this.grade = 'A+';
    else if (this.percentage >= 80) this.grade = 'A';
    else if (this.percentage >= 70) this.grade = 'B+';
    else if (this.percentage >= 60) this.grade = 'B';
    else if (this.percentage >= 50) this.grade = 'C';
    else if (this.percentage >= 40) this.grade = 'D';
    else this.grade = 'F';

    // Calculate subject grades
    this.subjects = this.subjects.map(s => {
      const pct = (s.marksObtained / (s.totalMarks || 100)) * 100;
      if (pct >= 90) s.grade = 'A+';
      else if (pct >= 80) s.grade = 'A';
      else if (pct >= 70) s.grade = 'B+';
      else if (pct >= 60) s.grade = 'B';
      else if (pct >= 50) s.grade = 'C';
      else if (pct >= 40) s.grade = 'D';
      else s.grade = 'F';
      return s;
    });
  }
  next();
});

reportCardSchema.index({ studentId: 1, academicYear: 1, term: 1 }, { unique: true });
reportCardSchema.index({ schoolId: 1, classId: 1 });

module.exports = mongoose.model('ReportCard', reportCardSchema);
