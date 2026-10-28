const Crop = require('../models/Crop');
const Farm = require('../models/Farm');
const SoilRecord = require('../models/SoilRecord');
const PestAlert = require('../models/PestAlert');
const Activity = require('../models/Activity');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const pick = require('../utils/pick');
const { sendSuccess } = require('../utils/response');
const { logActivity } = require('../services/activityService');
const { searchRegex, escapeRegex, getPagination, buildMeta, ownerFilter, isAdmin } = require('../utils/helpers');

const FIELDS = ['farm', 'name', 'variety', 'plantingDate', 'expectedHarvestDate', 'growthStage', 'healthStatus', 'areaAcres', 'soilType', 'irrigationMethod', 'notes'];

async function findCrop(req) {
  const crop = await Crop.findOne({ _id: req.params.id, ...ownerFilter(req.user) });
  if (!crop) throw new AppError(404, 'Crop not found.');
  return crop;
}

function assertDates(planting, harvest) {
  if (planting && harvest && new Date(harvest) <= new Date(planting)) {
    throw new AppError(422, 'Please correct the highlighted fields.', { expectedHarvestDate: 'Expected harvest date must be after the planting date.' });
  }
}

// The farm must belong to the crop's owner — farmers cannot attach crops to someone else's farm.
async function assertFarm(farmId, ownerId) {
  const farm = await Farm.findOne({ _id: farmId, owner: ownerId }).select('_id');
  if (!farm) throw new AppError(422, 'Please correct the highlighted fields.', { farm: 'Select one of your own farms.' });
}

exports.list = asyncHandler(async (req, res) => {
  const filter = ownerFilter(req.user);
  const { farm, stage, health, q } = req.query;
  if (farm) filter.farm = String(farm);
  if (stage) filter.growthStage = String(stage);
  if (health) filter.healthStatus = String(health);
  if (q) {
    const rx = searchRegex(q);
    filter.$or = [{ name: rx }, { variety: rx }];
  }
  const pagination = getPagination(req.query, 50);

  const query = Crop.find(filter).populate('farm', 'name location').sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit);
  if (isAdmin(req.user)) query.populate('owner', 'name email');

  const [crops, total] = await Promise.all([query, Crop.countDocuments(filter)]);
  sendSuccess(res, crops, 'Crops retrieved successfully.', 200, buildMeta(total, pagination));
});

exports.get = asyncHandler(async (req, res) => {
  const crop = await findCrop(req);
  await crop.populate('farm', 'name location soilType irrigationType');

  const [pestAlerts, latestSoil, activities] = await Promise.all([
    PestAlert.find({ active: true, crops: new RegExp(`^${escapeRegex(crop.name)}$`, 'i') }).sort({ riskScore: -1 }).limit(5).lean(),
    SoilRecord.findOne({ farm: crop.farm._id }).sort({ sampledOn: -1 }).lean(),
    Activity.find({ user: crop.owner, type: 'crop', message: new RegExp(escapeRegex(crop.name), 'i') }).sort({ createdAt: -1 }).limit(6).lean(),
  ]);

  sendSuccess(res, { crop, pestAlerts, latestSoil, activities }, 'Crop retrieved successfully.');
});

exports.create = asyncHandler(async (req, res) => {
  assertDates(req.body.plantingDate, req.body.expectedHarvestDate);
  await assertFarm(req.body.farm, req.user._id);

  const crop = await Crop.create({ ...pick(req.body, FIELDS), owner: req.user._id });
  await logActivity(req.user._id, 'crop', `Added crop ${crop.name}${crop.variety ? ` (${crop.variety})` : ''}`);
  sendSuccess(res, crop, 'Crop added successfully.', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const crop = await findCrop(req);
  const changes = pick(req.body, FIELDS);

  assertDates(changes.plantingDate || crop.plantingDate, changes.expectedHarvestDate || crop.expectedHarvestDate);
  if (changes.farm && String(changes.farm) !== String(crop.farm)) await assertFarm(changes.farm, crop.owner);

  Object.assign(crop, changes);
  await crop.save();
  await logActivity(crop.owner, 'crop', `Updated crop ${crop.name} — stage: ${crop.growthStage}`);
  sendSuccess(res, crop, 'Crop updated successfully.');
});

exports.remove = asyncHandler(async (req, res) => {
  const crop = await findCrop(req);
  await crop.deleteOne();
  await logActivity(crop.owner, 'crop', `Removed crop ${crop.name}`);
  sendSuccess(res, null, 'Crop deleted successfully.');
});
