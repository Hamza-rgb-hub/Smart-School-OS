const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
    maxlength: [200, 'School name cannot exceed 200 characters']
  },
  email: {
    type: String,
    required: [true, 'School email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  logo: {
    type: String,
    default: null
  },
  website: {
    type: String,
    default: null
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: null
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  settings: {
    allowOnlineClasses: { type: Boolean, default: false },
    maxStudents: { type: Number, default: 1000 },
    academicYear: { type: String, default: new Date().getFullYear().toString() }
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for student count
schoolSchema.virtual('studentCount', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'schoolId',
  count: true
});

// Virtual for teacher count
schoolSchema.virtual('teacherCount', {
  ref: 'Teacher',
  localField: '_id',
  foreignField: 'schoolId',
  count: true
});

module.exports = mongoose.model('School', schoolSchema);
