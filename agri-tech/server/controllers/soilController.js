const SoilRecord = require('../models/SoilRecord');
const Farm = require('../models/Farm');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const pick = require('../utils/pick');
const { sendSuccess } = require('../utils/response');
const { analyse, DISCLAIMER } = require('../services/soilService');
const { logActivity } = require('../services/activityService');
const { getPagination, buildMeta } = require('../utils/helpers');

const FIELDS = ['farm', 'soilType', 'ph', 'nitrogen', 'phosphorus', 'potassium', 'moisture', 'organicMatter', 'sampledOn', 'notes'];

exports.list = asyncHandler(async (req, res) => {
  const filter = { owner: req.user._id };
  if (req.query.farm) filter.farm = String(req.query.farm);
  const pagination = getPagination(req.query, 20);

  const [records, total] = await Promise.all([
    SoilRecord.find(filter).populate('farm', 'name').sort({ sampledOn: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    SoilRecord.countDocuments(filter),
  ]);
  sendSuccess(res, records, 'Soil records retrieved successfully.', 200, { ...buildMeta(total, pagination), disclaimer: DISCLAIMER });
});

exports.create = asyncHandler(async (req, res) => {
  const farm = await Farm.findOne({ _id: req.body.farm, owner: req.user._id });
  if (!farm) throw new AppError(422, 'Please correct the highlighted fields.', { farm: 'Select one of your own farms.' });

  const values = pick(req.body, FIELDS);
  const record = await SoilRecord.create({
    ...values,
    soilType: values.soilType || farm.soilType,
    owner: req.user._id,
    analysis: analyse(values),
  });
  await record.populate('farm', 'name');
  await logActivity(req.user._id, 'soil', `Soil analysis for "${farm.name}": ${record.analysis.overallStatus} (${record.analysis.overallScore}/100)`);

  sendSuccess(res, record, 'Soil analysis saved successfully.', 201, { disclaimer: DISCLAIMER });
});

exports.remove = asyncHandler(async (req, res) => {
  const record = await SoilRecord.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!record) throw new AppError(404, 'Soil record not found.');
  sendSuccess(res, null, 'Soil record deleted successfully.');
});
