const Farm = require('../models/Farm');
const WeatherAlert = require('../models/WeatherAlert');
const WeatherData = require('../models/WeatherData');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const pick = require('../utils/pick');
const { sendSuccess } = require('../utils/response');
const { getWeather } = require('../services/weatherService');
const { searchRegex, getPagination, buildMeta } = require('../utils/helpers');

const ALERT_FIELDS = ['title', 'message', 'severity', 'region', 'active', 'expiresAt'];

// GET /api/weather?location=Bhopal — falls back to the farmer's farm / profile location.
exports.getForecast = asyncHandler(async (req, res) => {
  let location = req.query.location ? String(req.query.location).trim() : '';

  if (!location) {
    const farm = await Farm.findOne({ owner: req.user._id }).sort({ createdAt: 1 }).select('location').lean();
    location = (farm && farm.location) || req.user.location || '';
  }
  if (!location) {
    throw new AppError(400, 'No location set. Add a farm or update your profile location, or search for a place.');
  }
  if (location.length > 100) throw new AppError(400, 'Location name is too long.');

  const weather = await getWeather(location);
  sendSuccess(res, weather, weather.stale ? 'Showing the last saved forecast — live data is unavailable right now.' : 'Weather retrieved successfully.');
});

exports.listAlerts = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' && req.query.all === '1' ? {} : { active: true };
  const alerts = await WeatherAlert.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  sendSuccess(res, alerts, 'Weather advisories retrieved successfully.');
});

exports.createAlert = asyncHandler(async (req, res) => {
  const alert = await WeatherAlert.create({ ...pick(req.body, ALERT_FIELDS), createdBy: req.user._id });
  sendSuccess(res, alert, 'Weather advisory published successfully.', 201);
});

exports.updateAlert = asyncHandler(async (req, res) => {
  const alert = await WeatherAlert.findById(req.params.id);
  if (!alert) throw new AppError(404, 'Weather advisory not found.');
  Object.assign(alert, pick(req.body, ALERT_FIELDS));
  await alert.save();
  sendSuccess(res, alert, 'Weather advisory updated successfully.');
});

exports.removeAlert = asyncHandler(async (req, res) => {
  const alert = await WeatherAlert.findByIdAndDelete(req.params.id);
  if (!alert) throw new AppError(404, 'Weather advisory not found.');
  sendSuccess(res, null, 'Weather advisory deleted successfully.');
});

exports.listRecords = asyncHandler(async (req, res) => {
  const filter = req.query.q ? { 'location.name': searchRegex(req.query.q) } : {};
  const pagination = getPagination(req.query, 20);
  const [records, total] = await Promise.all([
    WeatherData.find(filter).sort({ fetchedAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    WeatherData.countDocuments(filter),
  ]);
  sendSuccess(res, records, 'Weather records retrieved successfully.', 200, buildMeta(total, pagination));
});

exports.removeRecord = asyncHandler(async (req, res) => {
  const record = await WeatherData.findByIdAndDelete(req.params.id);
  if (!record) throw new AppError(404, 'Weather record not found.');
  sendSuccess(res, null, 'Cached weather record deleted successfully.');
});
