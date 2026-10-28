const Expert = require('../models/Expert');
const Consultation = require('../models/Consultation');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const pick = require('../utils/pick');
const { sendSuccess } = require('../utils/response');
const { logActivity } = require('../services/activityService');
const { searchRegex, getPagination, buildMeta, isAdmin } = require('../utils/helpers');

const FIELDS = ['name', 'title', 'expertise', 'experienceYears', 'specializations', 'availability', 'languages', 'bio', 'isActive'];

exports.list = asyncHandler(async (req, res) => {
  const filter = isAdmin(req.user) ? {} : { isActive: true };
  if (req.query.q) {
    const rx = searchRegex(req.query.q);
    filter.$or = [{ name: rx }, { expertise: rx }, { title: rx }, { specializations: rx }];
  }
  const pagination = getPagination(req.query, 50);
  const [experts, total] = await Promise.all([
    Expert.find(filter).sort({ name: 1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    Expert.countDocuments(filter),
  ]);
  sendSuccess(res, experts, 'Experts retrieved successfully.', 200, buildMeta(total, pagination));
});

exports.get = asyncHandler(async (req, res) => {
  const expert = await Expert.findById(req.params.id).lean();
  if (!expert || (!expert.isActive && !isAdmin(req.user))) throw new AppError(404, 'Expert not found.');
  sendSuccess(res, expert, 'Expert retrieved successfully.');
});

exports.create = asyncHandler(async (req, res) => {
  const expert = await Expert.create(pick(req.body, FIELDS));
  sendSuccess(res, expert, 'Expert added successfully.', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const expert = await Expert.findById(req.params.id);
  if (!expert) throw new AppError(404, 'Expert not found.');
  Object.assign(expert, pick(req.body, FIELDS));
  await expert.save();
  sendSuccess(res, expert, 'Expert updated successfully.');
});

exports.remove = asyncHandler(async (req, res) => {
  const expert = await Expert.findById(req.params.id);
  if (!expert) throw new AppError(404, 'Expert not found.');
  const openRequests = await Consultation.countDocuments({ expert: expert._id, status: { $in: ['Requested', 'Accepted', 'In Progress'] } });
  if (openRequests > 0) {
    throw new AppError(409, `This expert still has ${openRequests} open consultation request(s). Complete or cancel them first, or deactivate the expert instead.`);
  }
  await expert.deleteOne();
  sendSuccess(res, null, 'Expert removed successfully.');
});

// ----------------------------------------------------------------------------- Consultations
const CONSULT_STATUS_RULES = {
  Requested: ['Accepted', 'Cancelled'],
  Accepted: ['In Progress', 'Completed', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

exports.listConsultations = asyncHandler(async (req, res) => {
  const filter = isAdmin(req.user) ? {} : { farmer: req.user._id };
  if (req.query.status) filter.status = String(req.query.status);
  const pagination = getPagination(req.query, 20);

  const query = Consultation.find(filter).populate('expert', 'name title expertise').sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit);
  if (isAdmin(req.user)) query.populate('farmer', 'name email phone location');

  const [consultations, total] = await Promise.all([query.lean(), Consultation.countDocuments(filter)]);
  sendSuccess(res, consultations, 'Consultations retrieved successfully.', 200, buildMeta(total, pagination));
});

exports.createConsultation = asyncHandler(async (req, res) => {
  const expert = await Expert.findOne({ _id: req.body.expert, isActive: true });
  if (!expert) throw new AppError(404, 'That expert is not available.');

  if (req.body.preferredDate && req.body.preferredDate < new Date(new Date().toDateString())) {
    throw new AppError(422, 'Please correct the highlighted fields.', { preferredDate: 'Preferred date cannot be in the past.' });
  }

  const consultation = await Consultation.create({
    ...pick(req.body, ['expert', 'topic', 'description', 'crop', 'preferredDate']),
    farmer: req.user._id,
  });
  await logActivity(req.user._id, 'consultation', `Requested consultation with ${expert.name}: ${consultation.topic}`);
  sendSuccess(res, consultation, 'Consultation request sent successfully.', 201);
});

// Admin sets any valid next status (and may add a response); farmers can only cancel their own request.
exports.updateConsultationStatus = asyncHandler(async (req, res) => {
  const consultation = await Consultation.findById(req.params.id);
  if (!consultation) throw new AppError(404, 'Consultation not found.');

  const { status, expertResponse } = req.body;
  if (!isAdmin(req.user)) {
    if (String(consultation.farmer) !== String(req.user._id)) throw new AppError(404, 'Consultation not found.');
    if (status !== 'Cancelled') throw new AppError(403, 'You can only cancel your own consultation request.');
  }

  if (status && status !== consultation.status) {
    if (!CONSULT_STATUS_RULES[consultation.status].includes(status)) {
      throw new AppError(409, `A "${consultation.status}" consultation cannot be changed to "${status}".`);
    }
    consultation.status = status;
  }
  if (expertResponse !== undefined && isAdmin(req.user)) consultation.expertResponse = expertResponse;
  await consultation.save();

  await logActivity(consultation.farmer, 'consultation', `Consultation "${consultation.topic}" is now ${consultation.status}`);
  sendSuccess(res, consultation, 'Consultation updated successfully.');
});
