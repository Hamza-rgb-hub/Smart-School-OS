const { FeeStructure, FeePayment } = require('../models/Fee');
const Student = require('../models/Student');
const { paginate } = require('../utils/paginate');

const getFeeStructures = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    const structures = await FeeStructure.find({ schoolId, isActive: true })
      .populate('classId', 'name section')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: structures });
  } catch (error) { next(error); }
};

const createFeeStructure = async (req, res, next) => {
  try {
    const structure = await FeeStructure.create({ ...req.body, schoolId: req.user.schoolId });
    res.status(201).json({ success: true, message: 'Fee structure created', data: structure });
  } catch (error) { next(error); }
};

const updateFeeStructure = async (req, res, next) => {
  try {
    const structure = await FeeStructure.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      req.body, { new: true }
    );
    if (!structure) return res.status(404).json({ success: false, message: 'Fee structure not found' });
    res.json({ success: true, message: 'Fee structure updated', data: structure });
  } catch (error) { next(error); }
};

const deleteFeeStructure = async (req, res, next) => {
  try {
    await FeeStructure.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { isActive: false }
    );
    res.json({ success: true, message: 'Fee structure deleted' });
  } catch (error) { next(error); }
};

const getFeePayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, studentId } = req.query;
    const schoolId = req.user.schoolId;
    const query = { schoolId };
    if (status) query.status = status;
    if (studentId) query.studentId = studentId;

    const result = await paginate(FeePayment, query, {
      page, limit,
      sort: { createdAt: -1 },
      populate: [
        { path: 'studentId', select: 'name rollNumber classId', populate: { path: 'classId', select: 'name section' } },
        { path: 'feeStructureId', select: 'name amount frequency' }
      ]
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
};

const createFeePayment = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    const payment = await FeePayment.create({ ...req.body, schoolId });

    // Update student fee status
    const pending = await FeePayment.countDocuments({ studentId: req.body.studentId, status: 'pending' });
    await Student.findByIdAndUpdate(req.body.studentId, {
      feeStatus: pending === 0 ? 'paid' : 'pending'
    });

    res.status(201).json({ success: true, message: 'Fee payment recorded', data: payment });
  } catch (error) { next(error); }
};

const updateFeePayment = async (req, res, next) => {
  try {
    const payment = await FeePayment.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      req.body, { new: true }
    ).populate('studentId', 'name rollNumber');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, message: 'Payment updated', data: payment });
  } catch (error) { next(error); }
};

const getFeeSummary = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    const [paid, pending, overdue, total] = await Promise.all([
      FeePayment.aggregate([{ $match: { schoolId, status: 'paid' } }, { $group: { _id: null, total: { $sum: '$paidAmount' } } }]),
      FeePayment.countDocuments({ schoolId, status: 'pending' }),
      FeePayment.countDocuments({ schoolId, status: 'overdue' }),
      FeePayment.aggregate([{ $match: { schoolId } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);
    res.json({
      success: true,
      data: {
        totalCollected: paid[0]?.total || 0,
        pendingCount: pending,
        overdueCount: overdue,
        totalDue: total[0]?.total || 0
      }
    });
  } catch (error) { next(error); }
};

module.exports = { getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure, getFeePayments, createFeePayment, updateFeePayment, getFeeSummary };
