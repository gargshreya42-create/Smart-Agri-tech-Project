const User = require('../models/User');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const Order = require('../models/Order');
const PestAlert = require('../models/PestAlert');
const Consultation = require('../models/Consultation');
const Post = require('../models/Post');
const Activity = require('../models/Activity');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const pick = require('../utils/pick');
const { sendSuccess } = require('../utils/response');
const { searchRegex, getPagination, buildMeta, lastMonths } = require('../utils/helpers');
const { ORDER_STATUSES, CROP_HEALTH, RISK_LEVELS, CONSULTATION_STATUSES } = require('../utils/constants');

const monthStart = (monthsBack) => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - monthsBack, 1);
};

// Turns [{_id: 'Pending', count: 3}] into {Pending: 3, ...} including zero-count keys.
const toCountMap = (rows, keys) => {
  const result = Object.fromEntries(keys.map((k) => [k, 0]));
  rows.forEach((row) => {
    result[row._id] = row.count;
  });
  return result;
};

// Fills month gaps so charts always get a continuous series.
function monthlySeries(rows, field = 'count') {
  return lastMonths(6).map(({ year, month, label }) => {
    const hit = rows.find((r) => r._id.y === year && r._id.m === month);
    return { label, value: hit ? hit[field] : 0 };
  });
}

const byMonth = { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } };

exports.getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalFarmers,
    totalFarms,
    totalCrops,
    totalOrders,
    pendingOrders,
    activePestAlerts,
    consultationRequests,
    communityPosts,
    ordersByStatus,
    cropsByHealth,
    pestsByRisk,
    userGrowth,
    recentOrders,
    recentActivity,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'farmer' }),
    Farm.countDocuments(),
    Crop.countDocuments(),
    Order.countDocuments(),
    Order.countDocuments({ status: 'Pending' }),
    PestAlert.countDocuments({ active: true }),
    Consultation.countDocuments({ status: 'Requested' }),
    Post.countDocuments(),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Crop.aggregate([{ $group: { _id: '$healthStatus', count: { $sum: 1 } } }]),
    PestAlert.aggregate([{ $match: { active: true } }, { $group: { _id: '$riskLevel', count: { $sum: 1 } } }]),
    User.aggregate([{ $match: { createdAt: { $gte: monthStart(5) } } }, { $group: { _id: byMonth, count: { $sum: 1 } } }]),
    Order.find().populate('user', 'name').sort({ createdAt: -1 }).limit(6).select('orderNumber user totalAmount status createdAt').lean(),
    Activity.find().populate('user', 'name').sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  sendSuccess(
    res,
    {
      totals: { totalUsers, totalFarmers, totalFarms, totalCrops, totalOrders, pendingOrders, activePestAlerts, consultationRequests, communityPosts },
      ordersByStatus: toCountMap(ordersByStatus, ORDER_STATUSES),
      cropsByHealth: toCountMap(cropsByHealth, CROP_HEALTH),
      pestsByRisk: toCountMap(pestsByRisk, RISK_LEVELS),
      userGrowth: monthlySeries(userGrowth),
      recentOrders,
      recentActivity,
    },
    'Statistics retrieved successfully.'
  );
});

exports.getReports = asyncHandler(async (req, res) => {
  const since = monthStart(5);
  const [revenue, orderVolume, topResources, cropsByName, consultationsByStatus, alertsByMonth, categorySales] = await Promise.all([
    Order.aggregate([{ $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: since } } }, { $group: { _id: byMonth, total: { $sum: '$totalAmount' } } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: byMonth, count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', quantity: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { quantity: -1 } },
      { $limit: 6 },
    ]),
    Crop.aggregate([{ $group: { _id: '$name', count: { $sum: 1 }, acres: { $sum: '$areaAcres' } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
    Consultation.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    PestAlert.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: byMonth, count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      { $lookup: { from: 'resources', localField: 'items.resource', foreignField: '_id', as: 'res' } },
      { $unwind: { path: '$res', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$res.category', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { revenue: -1 } },
    ]),
  ]);

  sendSuccess(
    res,
    {
      revenueByMonth: monthlySeries(revenue, 'total'),
      ordersByMonth: monthlySeries(orderVolume),
      pestAlertsByMonth: monthlySeries(alertsByMonth),
      topResources: topResources.map((r) => ({ name: r._id, quantity: r.quantity, revenue: r.revenue })),
      salesByCategory: categorySales.map((c) => ({ category: c._id, revenue: c.revenue })),
      cropsByName: cropsByName.map((c) => ({ name: c._id, count: c.count, acres: Math.round(c.acres * 10) / 10 })),
      consultationsByStatus: toCountMap(consultationsByStatus, CONSULTATION_STATUSES),
    },
    'Reports retrieved successfully.'
  );
});

// ----------------------------------------------------------------------------- Users
exports.listUsers = asyncHandler(async (req, res) => {
  const { q, role, status } = req.query;
  const filter = {};
  if (role && ['farmer', 'admin'].includes(String(role))) filter.role = String(role);
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;
  if (q) {
    const rx = searchRegex(q);
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { location: rx }];
  }
  const pagination = getPagination(req.query, 20);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit),
    User.countDocuments(filter),
  ]);
  sendSuccess(res, users, 'Users retrieved successfully.', 200, buildMeta(total, pagination));
});

// Admin accounts can only be created here — never through public registration.
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, location, language, role } = req.body;
  const user = await User.create({ name, email, phone, password, location, language, role: role || 'farmer' });
  sendSuccess(res, user, 'User created successfully.', 201);
});

exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError(404, 'User not found.');

  const changes = pick(req.body, ['name', 'phone', 'location', 'language', 'role', 'isActive']);
  const isSelf = String(user._id) === String(req.user._id);
  if (isSelf && (changes.isActive === false || (changes.role && changes.role !== 'admin'))) {
    throw new AppError(409, 'You cannot deactivate or demote your own admin account.');
  }

  // Deactivation or a role change revokes tokens issued earlier.
  const revokeSessions = changes.isActive === false || (changes.role && changes.role !== user.role);
  Object.assign(user, changes);
  if (revokeSessions) user.tokenVersion += 1;
  await user.save();
  sendSuccess(res, user, 'User updated successfully.');
});
