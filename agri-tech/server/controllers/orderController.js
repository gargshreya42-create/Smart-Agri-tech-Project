const Order = require('../models/Order');
const Resource = require('../models/Resource');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { checkValue } = require('../utils/validate');
const { ORDER_TRANSITIONS, ORDER_STATUSES } = require('../utils/constants');
const { logActivity } = require('../services/activityService');
const { searchRegex, getPagination, buildMeta, isAdmin } = require('../utils/helpers');

const DELIVERY_RULES = {
  name: { label: 'Recipient name', required: true, minLength: 2, maxLength: 80 },
  phone: { label: 'Phone', type: 'phone', required: true },
  address: { label: 'Address', required: true, minLength: 5, maxLength: 250 },
  city: { label: 'City', required: true, maxLength: 80 },
  pincode: { label: 'PIN code', required: true, pattern: /^\d{6}$/, message: 'PIN code must be 6 digits.' },
};

// Validates { items: [{ resource, quantity }], delivery: {...} } before the controller runs.
exports.validateOrderPayload = (req, res, next) => {
  const errors = {};
  const { items, delivery } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    errors.items = 'Add at least one item to your order.';
  } else if (items.length > 50) {
    errors.items = 'An order can contain at most 50 different items.';
  } else {
    const cleaned = [];
    items.forEach((item, index) => {
      const resource = item && checkValue(item.resource, { type: 'objectId' }, 'Resource');
      const quantity = item && checkValue(item.quantity, { type: 'integer', min: 1, max: 1000 }, 'Quantity');
      if (!resource || resource.error) errors[`items.${index}.resource`] = 'Invalid resource.';
      else if (!quantity || quantity.error) errors[`items.${index}.quantity`] = quantity ? quantity.error : 'Invalid quantity.';
      else cleaned.push({ resource: resource.value, quantity: quantity.value });
    });
    if (!Object.keys(errors).length) req.body.items = cleaned;
  }

  const cleanDelivery = {};
  Object.entries(DELIVERY_RULES).forEach(([field, rule]) => {
    const raw = delivery && typeof delivery === 'object' ? delivery[field] : undefined;
    if (raw === undefined || raw === null || String(raw).trim() === '') {
      errors[`delivery.${field}`] = `${rule.label} is required.`;
      return;
    }
    const result = checkValue(raw, rule, rule.label);
    if (result.error) errors[`delivery.${field}`] = result.error;
    else cleanDelivery[field] = result.value;
  });
  req.body.delivery = cleanDelivery;

  if (req.body.notes !== undefined && (typeof req.body.notes !== 'string' || req.body.notes.length > 500)) {
    errors.notes = 'Notes must be text up to 500 characters.';
  }

  if (Object.keys(errors).length) return next(new AppError(422, 'Please correct the highlighted fields.', errors));
  return next();
};

async function restoreStock(items) {
  await Promise.all(items.map((item) => Resource.updateOne({ _id: item.resource }, { $inc: { stock: item.quantity } })));
}

exports.create = asyncHandler(async (req, res) => {
  const { items, delivery, notes } = req.body;

  // Merge duplicate lines for the same product.
  const wanted = new Map();
  items.forEach(({ resource, quantity }) => wanted.set(resource, (wanted.get(resource) || 0) + quantity));

  const resources = await Resource.find({ _id: { $in: [...wanted.keys()] } });
  if (resources.length !== wanted.size) {
    throw new AppError(404, 'One or more items in your cart are no longer in the catalogue. Please refresh your cart.');
  }

  // Reserve stock atomically per product; roll back on any failure so stock never goes negative.
  const reserved = [];
  try {
    for (const resource of resources) {
      const quantity = wanted.get(String(resource._id));
      const updated = await Resource.findOneAndUpdate(
        { _id: resource._id, available: true, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      );
      if (!updated) throw new AppError(409, `"${resource.name}" does not have enough stock for the quantity requested.`);
      reserved.push({ resource: resource._id, quantity });
    }
  } catch (err) {
    await restoreStock(reserved);
    throw err;
  }

  // Prices always come from the database, never from the client.
  const orderItems = resources.map((r) => ({ resource: r._id, name: r.name, unit: r.unit, price: r.price, quantity: wanted.get(String(r._id)) }));
  const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let order;
  try {
    order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      delivery,
      notes,
      statusHistory: [{ status: 'Pending', note: 'Order placed' }],
    });
  } catch (err) {
    await restoreStock(reserved);
    throw err;
  }

  await logActivity(req.user._id, 'order', `Placed order ${order.orderNumber} (₹${totalAmount.toLocaleString('en-IN')})`);
  sendSuccess(res, order, 'Order placed successfully.', 201);
});

exports.list = asyncHandler(async (req, res) => {
  const filter = isAdmin(req.user) ? {} : { user: req.user._id };
  if (req.query.status && ORDER_STATUSES.includes(String(req.query.status))) filter.status = String(req.query.status);
  if (req.query.q) filter.orderNumber = searchRegex(req.query.q);
  const pagination = getPagination(req.query, 20);

  const query = Order.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit);
  if (isAdmin(req.user)) query.populate('user', 'name email phone');

  const [orders, total] = await Promise.all([query.lean(), Order.countDocuments(filter)]);
  sendSuccess(res, orders, 'Orders retrieved successfully.', 200, buildMeta(total, pagination));
});

exports.get = asyncHandler(async (req, res) => {
  const filter = isAdmin(req.user) ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };
  const order = await Order.findOne(filter).populate('user', 'name email phone');
  if (!order) throw new AppError(404, 'Order not found.');
  sendSuccess(res, order, 'Order retrieved successfully.');
});

async function applyStatus(order, status, note) {
  const allowed = ORDER_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    throw new AppError(409, `An order that is "${order.status}" cannot be changed to "${status}".`);
  }
  if (status === 'Cancelled') await restoreStock(order.items);
  order.status = status;
  order.statusHistory.push({ status, note });
  await order.save();
  await logActivity(order.user, 'order', `Order ${order.orderNumber} is now ${status}`);
}

// Admin: move an order through its workflow.
exports.updateStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError(404, 'Order not found.');
  await applyStatus(order, req.body.status, req.body.note);
  sendSuccess(res, order, `Order marked as ${order.status}.`);
});

// Farmer: cancel own order while it has not been processed yet.
exports.cancel = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new AppError(404, 'Order not found.');
  if (!['Pending', 'Confirmed'].includes(order.status)) {
    throw new AppError(409, 'This order is already being processed and can no longer be cancelled.');
  }
  await applyStatus(order, 'Cancelled', 'Cancelled by farmer');
  sendSuccess(res, order, 'Order cancelled successfully.');
});
