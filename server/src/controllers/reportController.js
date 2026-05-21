const ReportCard = require('../models/ReportCard');
const Student = require('../models/Student');
const { paginate } = require('../utils/paginate');

const getReportCards = async (req, res, next) => {
  try {
    const { classId, term, academicYear, page = 1, limit = 10 } = req.query;
    const schoolId = req.user.schoolId;
    const query = { schoolId };
    if (classId) query.classId = classId;
    if (term) query.term = term;
    if (academicYear) query.academicYear = academicYear;

    const result = await paginate(ReportCard, query, {
      page, limit,
      sort: { createdAt: -1 },
      populate: [
        { path: 'studentId', select: 'name rollNumber profileImage' },
        { path: 'classId', select: 'name section' }
      ]
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
};

const getStudentReportCard = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { term, academicYear } = req.query;
    const schoolId = req.user.schoolId;

    const query = { studentId, schoolId };
    if (term) query.term = term;
    if (academicYear) query.academicYear = academicYear;

    const reports = await ReportCard.find(query)
      .populate('studentId', 'name rollNumber profileImage')
      .populate('classId', 'name section')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reports });
  } catch (error) { next(error); }
};

const createReportCard = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    const report = await ReportCard.create({ ...req.body, schoolId });
    const populated = await report.populate([
      { path: 'studentId', select: 'name rollNumber' },
      { path: 'classId', select: 'name section' }
    ]);
    res.status(201).json({ success: true, message: 'Report card created', data: populated });
  } catch (error) { next(error); }
};

const updateReportCard = async (req, res, next) => {
  try {
    const report = await ReportCard.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      req.body, { new: true, runValidators: true }
    ).populate('studentId', 'name rollNumber').populate('classId', 'name section');
    if (!report) return res.status(404).json({ success: false, message: 'Report card not found' });
    res.json({ success: true, message: 'Report card updated', data: report });
  } catch (error) { next(error); }
};

const publishReportCard = async (req, res, next) => {
  try {
    const report = await ReportCard.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { isPublished: true, publishedAt: new Date() },
      { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: 'Report card not found' });
    res.json({ success: true, message: 'Report card published', data: report });
  } catch (error) { next(error); }
};

const deleteReportCard = async (req, res, next) => {
  try {
    const report = await ReportCard.findOneAndDelete({ _id: req.params.id, schoolId: req.user.schoolId });
    if (!report) return res.status(404).json({ success: false, message: 'Report card not found' });
    res.json({ success: true, message: 'Report card deleted' });
  } catch (error) { next(error); }
};

module.exports = { getReportCards, getStudentReportCard, createReportCard, updateReportCard, publishReportCard, deleteReportCard };
