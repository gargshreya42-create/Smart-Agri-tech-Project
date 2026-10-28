const PestAlert = require('../models/PestAlert');
const Crop = require('../models/Crop');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const pick = require('../utils/pick');
const { sendSuccess } = require('../utils/response');
const { searchRegex, escapeRegex, getPagination, buildMeta, isAdmin } = require('../utils/helpers');
const { logActivity } = require('../services/activityService');

const FIELDS = ['name', 'type', 'crops', 'riskLevel', 'region', 'detectedOn', 'description', 'preventiveSuggestions', 'recommendedAction', 'imageUrl', 'active'];

exports.list = asyncHandler(async (req, res) => {
  const filter = isAdmin(req.user) ? {} : { active: true };
  const { q, risk, crop, mine, status } = req.query;

  if (isAdmin(req.user) && status === 'active') filter.active = true;
  if (isAdmin(req.user) && status === 'inactive') filter.active = false;
  if (risk) filter.riskLevel = String(risk);
  if (crop) filter.crops = new RegExp(`^${escapeRegex(String(crop))}$`, 'i');
  if (q) {
    const rx = searchRegex(q);
    filter.$or = [{ name: rx }, { description: rx }, { crops: rx }];
  }

  // mine=true narrows to alerts for crops the farmer is currently growing.
  if (mine === 'true' && !isAdmin(req.user)) {
    const names = await Crop.distinct('name', { owner: req.user._id, growthStage: { $ne: 'Harvested' } });
    filter.crops = { $in: names.map((n) => new RegExp(`^${escapeRegex(n)}$`, 'i')) };
  }

  const pagination = getPagination(req.query, 50);
  const [alerts, total] = await Promise.all([
    PestAlert.find(filter).sort({ riskScore: -1, detectedOn: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    PestAlert.countDocuments(filter),
  ]);
  sendSuccess(res, alerts, 'Pest alerts retrieved successfully.', 200, buildMeta(total, pagination));
});

exports.get = asyncHandler(async (req, res) => {
  const alert = await PestAlert.findById(req.params.id).lean();
  if (!alert || (!alert.active && !isAdmin(req.user))) throw new AppError(404, 'Pest alert not found.');
  sendSuccess(res, alert, 'Pest alert retrieved successfully.');
});

exports.create = asyncHandler(async (req, res) => {
  const alert = await PestAlert.create({ ...pick(req.body, FIELDS), createdBy: req.user._id });
  await logActivity(req.user._id, 'community', `Published pest alert: ${alert.name}`);
  sendSuccess(res, alert, 'Pest alert created successfully.', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const alert = await PestAlert.findById(req.params.id);
  if (!alert) throw new AppError(404, 'Pest alert not found.');
  Object.assign(alert, pick(req.body, FIELDS));
  await alert.save(); // save() (not findOneAndUpdate) so riskScore is recalculated
  sendSuccess(res, alert, 'Pest alert updated successfully.');
});

exports.remove = asyncHandler(async (req, res) => {
  const alert = await PestAlert.findByIdAndDelete(req.params.id);
  if (!alert) throw new AppError(404, 'Pest alert not found.');
  sendSuccess(res, null, 'Pest alert deleted successfully.');
});
