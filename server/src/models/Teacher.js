const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Teacher name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  employeeId: {
    type: String,
    trim: true
  },
  subjects: [{
    type: String,
    trim: true
  }],
  qualification: {
    type: String,
    trim: true
  },
  experience: {
    type: Number,
    min: 0
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  dateOfBirth: Date,
  profileImage: {
    type: String,
    default: null
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School ID is required']
  },
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  address: {
    street: String,
    city: String,
    state: String,
    country: String
  },
  salary: {
    type: Number,
    default: 0
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

teacherSchema.index({ schoolId: 1 });
teacherSchema.index({ email: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model('Teacher', teacherSchema);
