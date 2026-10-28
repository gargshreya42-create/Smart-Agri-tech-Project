const Resource = require('../models/Resource');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const pick = require('../utils/pick');
const { sendSuccess } = require('../utils/response');
const { searchRegex, getPagination, buildMeta } = require('../utils/helpers');

const FIELDS = ['name', 'category', 'brand', 'description', 'price', 'unit', 'stock', 'available', 'imageUrl'];
const SORTS = { 'price-asc': { price: 1 }, 'price-desc': { price: -1 }, name: { name: 1 }, newest: { createdAt: -1 } };

exports.list = asyncHandler(async (req, res) => {
  const { q, category, availability, sort } = req.query;
  const filter = {};
  if (category) filter.category = String(category);
  if (availability === 'in-stock') Object.assign(filter, { available: true, stock: { $gt: 0 } });
  if (availability === 'out-of-stock') filter.$or = [{ available: false }, { stock: 0 }];
  if (q) {
    const rx = searchRegex(q);
    filter.$and = [{ $or: [{ name: rx }, { description: rx }, { brand: rx }] }];
  }

  const pagination = getPagination(req.query, 24);
  const [resources, total] = await Promise.all([
    Resource.find(filter).sort(SORTS[sort] || SORTS.name).skip(pagination.skip).limit(pagination.limit),
    Resource.countDocuments(filter),
  ]);
  sendSuccess(res, resources, 'Resources retrieved successfully.', 200, buildMeta(total, pagination));
});

exports.get = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) throw new AppError(404, 'Resource not found.');
  sendSuccess(res, resource, 'Resource retrieved successfully.');
});

exports.create = asyncHandler(async (req, res) => {
  const resource = await Resource.create(pick(req.body, FIELDS));
  sendSuccess(res, resource, 'Resource added successfully.', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) throw new AppError(404, 'Resource not found.');
  Object.assign(resource, pick(req.body, FIELDS));
  await resource.save();
  sendSuccess(res, resource, 'Resource updated successfully.');
});

exports.remove = asyncHandler(async (req, res) => {
  const resource = await Resource.findByIdAndDelete(req.params.id);
  if (!resource) throw new AppError(404, 'Resource not found.');
  sendSuccess(res, null, 'Resource deleted successfully.');
});
