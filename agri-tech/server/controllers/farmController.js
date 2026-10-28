const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const SoilRecord = require('../models/SoilRecord');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const pick = require('../utils/pick');
const { sendSuccess } = require('../utils/response');
const { logActivity } = require('../services/activityService');
const { searchRegex, getPagination, buildMeta, ownerFilter, isAdmin } = require('../utils/helpers');

const FIELDS = ['name', 'location', 'sizeAcres', 'soilType', 'irrigationType', 'farmingType', 'primaryCrops', 'imageUrl', 'notes'];

async function findFarm(req) {
  const farm = await Farm.findOne({ _id: req.params.id, ...ownerFilter(req.user) });
  if (!farm) throw new AppError(404, 'Farm not found.');
  return farm;
}

exports.list = asyncHandler(async (req, res) => {
  const filter = ownerFilter(req.user);
  if (req.query.q) {
    const rx = searchRegex(req.query.q);
    filter.$or = [{ name: rx }, { location: rx }];
  }
  const pagination = getPagination(req.query, 50);

  const query = Farm.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit);
  if (isAdmin(req.user)) query.populate('owner', 'name email phone');

  const [farms, total] = await Promise.all([query.lean(), Farm.countDocuments(filter)]);

  // Attach crop counts in one aggregation instead of one query per farm.
  const counts = await Crop.aggregate([{ $match: { farm: { $in: farms.map((f) => f._id) } } }, { $group: { _id: '$farm', count: { $sum: 1 } } }]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  farms.forEach((farm) => {
    farm.cropCount = countMap.get(String(farm._id)) || 0;
  });

  sendSuccess(res, farms, 'Farms retrieved successfully.', 200, buildMeta(total, pagination));
});

exports.get = asyncHandler(async (req, res) => {
  const farm = await findFarm(req);
  const [crops, latestSoil] = await Promise.all([
    Crop.find({ farm: farm._id }).sort({ createdAt: -1 }),
    SoilRecord.findOne({ farm: farm._id }).sort({ sampledOn: -1 }).lean(),
  ]);
  sendSuccess(res, { farm, crops, latestSoil }, 'Farm retrieved successfully.');
});

exports.create = asyncHandler(async (req, res) => {
  const farm = await Farm.create({ ...pick(req.body, FIELDS), owner: req.user._id });
  await logActivity(req.user._id, 'farm', `Added farm "${farm.name}"`);
  sendSuccess(res, farm, 'Farm added successfully.', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const farm = await findFarm(req);
  Object.assign(farm, pick(req.body, FIELDS));
  await farm.save();
  await logActivity(farm.owner, 'farm', `Updated farm "${farm.name}"`);
  sendSuccess(res, farm, 'Farm details updated successfully.');
});

// Deleting a farm also removes its crops and soil records so no orphaned data is left behind.
exports.remove = asyncHandler(async (req, res) => {
  const farm = await findFarm(req);
  await Promise.all([Crop.deleteMany({ farm: farm._id }), SoilRecord.deleteMany({ farm: farm._id })]);
  await farm.deleteOne();
  await logActivity(farm.owner, 'farm', `Removed farm "${farm.name}"`);
  sendSuccess(res, null, 'Farm deleted successfully.');
});
