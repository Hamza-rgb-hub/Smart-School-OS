const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Fee structure name is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  frequency: {
    type: String,
    enum: ['monthly', 'quarterly', 'annually', 'one-time'],
    default: 'monthly'
  },
  description: String,
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: null
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const feePaymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  feeStructureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: Date,
  status: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'overdue'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'online', 'cheque'],
    default: 'cash'
  },
  transactionId: String,
  remarks: String,
  month: String,
  year: Number
}, { timestamps: true });

feePaymentSchema.index({ studentId: 1, schoolId: 1 });
feePaymentSchema.index({ schoolId: 1, status: 1 });

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
const FeePayment = mongoose.model('FeePayment', feePaymentSchema);

module.exports = { FeeStructure, FeePayment };
