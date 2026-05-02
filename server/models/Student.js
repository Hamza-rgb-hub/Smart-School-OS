const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true
  },
  phone: {
    type: String,
    trim: true
  },
  rollNumber: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
    default: 'unknown'
  },
  profileImage: {
    type: String,
    default: null
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: null
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required']
  },
  parentInfo: {
    fatherName: String,
    motherName: String,
    guardianName: String,
    guardianPhone: String,
    guardianEmail: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  feeStatus: {
    type: String,
    enum: ['paid', 'pending', 'partial', 'overdue'],
    default: 'pending'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for rollNumber uniqueness within a school
studentSchema.index({ rollNumber: 1, schoolId: 1 }, { unique: true, sparse: true });
studentSchema.index({ schoolId: 1 });
studentSchema.index({ classId: 1 });

module.exports = mongoose.model('Student', studentSchema);
