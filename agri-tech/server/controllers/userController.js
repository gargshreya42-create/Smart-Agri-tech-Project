const User = require('../models/User');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const SoilRecord = require('../models/SoilRecord');
const Order = require('../models/Order');
const PestAlert = require('../models/PestAlert');
const Activity = require('../models/Activity');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const pick = require('../utils/pick');
const { sendSuccess } = require('../utils/response');
const { escapeRegex } = require('../utils/helpers');
const { signToken } = require('./authController');

const DAY_MS = 24 * 60 * 60 * 1000;

exports.getProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: req.user }, 'Profile retrieved successfully.');
});

exports.updateProfile = asyncHandler(async (req, res) => {
  Object.assign(req.user, pick(req.body, ['name', 'phone', 'location', 'language']));
  await req.user.save();
  sendSuccess(res, { user: req.user }, 'Profile updated successfully.');
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError(422, 'Please correct the highlighted fields.', { currentPassword: 'Current password is incorrect.' });
  }
  if (currentPassword === newPassword) {
    throw new AppError(422, 'Please correct the highlighted fields.', { newPassword: 'Choose a password different from the current one.' });
  }

  user.password = newPassword;
  user.tokenVersion += 1; // sign out every other device
  await user.save();
  sendSuccess(res, { token: signToken(user) }, 'Password changed successfully.');
});

exports.getActivity = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30).lean();
  sendSuccess(res, activities, 'Activity retrieved successfully.');
});

const SEVERITY_ORDER = { danger: 0, warning: 1, info: 2, success: 3 };

exports.getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [farms, crops, latestSoil, pendingOrders, recentlyDelivered, activities] = await Promise.all([
    Farm.find({ owner: userId }).sort({ createdAt: -1 }).lean(),
    Crop.find({ owner: userId }).populate('farm', 'name location').sort({ createdAt: -1 }),
    SoilRecord.findOne({ owner: userId }).sort({ sampledOn: -1 }).populate('farm', 'name').lean(),
    Order.countDocuments({ user: userId, status: { $in: ['Pending', 'Confirmed', 'Processing', 'Shipped'] } }),
    Order.find({ user: userId, status: 'Delivered', updatedAt: { $gte: new Date(Date.now() - 3 * DAY_MS) } }).select('orderNumber').lean(),
    Activity.find({ user: userId }).sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  const activeCrops = crops.filter((c) => c.growthStage !== 'Harvested');
  const cropNames = [...new Set(activeCrops.map((c) => c.name))];

  const pestAlerts = cropNames.length
    ? await PestAlert.find({
        active: true,
        crops: { $in: cropNames.map((name) => new RegExp(`^${escapeRegex(name)}$`, 'i')) },
      })
        .sort({ riskScore: -1, detectedOn: -1 })
        .limit(5)
        .lean()
    : [];

  // Derived, farmer-facing alerts (weather alerts are fetched separately by the client).
  const alerts = [];
  pestAlerts
    .filter((p) => p.riskScore >= 3)
    .forEach((p) =>
      alerts.push({ type: 'pest', severity: p.riskLevel === 'Critical' ? 'danger' : 'warning', title: `${p.name} risk — ${p.riskLevel}`, message: p.recommendedAction })
    );

  const moisture = latestSoil && latestSoil.analysis && latestSoil.analysis.parameters.moisture;
  if (moisture && ['Poor', 'Critical'].includes(moisture.status)) {
    alerts.push({ type: 'soil', severity: 'warning', title: 'Soil moisture is low', message: `Latest reading is ${moisture.value}%. Consider irrigating soon.` });
  }

  activeCrops
    .filter((c) => ['At Risk', 'Needs Attention'].includes(c.healthStatus))
    .forEach((c) =>
      alerts.push({
        type: 'crop',
        severity: c.healthStatus === 'At Risk' ? 'danger' : 'warning',
        title: `Crop monitoring required: ${c.name}`,
        message: `${c.name} is marked "${c.healthStatus}". Inspect the field and update the crop record.`,
      })
    );

  activeCrops
    .filter((c) => c.daysToHarvest !== null && c.daysToHarvest >= 0 && c.daysToHarvest <= 14)
    .forEach((c) => alerts.push({ type: 'harvest', severity: 'info', title: `Harvest approaching: ${c.name}`, message: `Expected in ${c.daysToHarvest} day(s). Arrange labour and storage.` }));

  recentlyDelivered.forEach((o) => alerts.push({ type: 'order', severity: 'success', title: 'Order delivered', message: `Order ${o.orderNumber} has been delivered.` }));

  alerts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  sendSuccess(
    res,
    {
      location: (farms[0] && farms[0].location) || req.user.location || null,
      stats: {
        totalFarms: farms.length,
        activeCrops: activeCrops.length,
        soilHealth: latestSoil ? latestSoil.analysis.overallStatus : null,
        soilScore: latestSoil ? latestSoil.analysis.overallScore : null,
        pestAlerts: pestAlerts.length,
        pendingOrders,
      },
      crops: activeCrops.slice(0, 6),
      farms: farms.slice(0, 3),
      pestAlerts,
      alerts: alerts.slice(0, 8),
      activities,
    },
    'Dashboard retrieved successfully.'
  );
});
