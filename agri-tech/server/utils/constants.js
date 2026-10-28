const SOIL_TYPES = ['Black (Regur)', 'Alluvial', 'Red', 'Laterite', 'Sandy', 'Loamy', 'Clayey', 'Mixed'];
const IRRIGATION_TYPES = ['Drip', 'Sprinkler', 'Canal', 'Tube well', 'Rain-fed', 'Flood', 'Farm pond'];
const FARMING_TYPES = ['Organic', 'Natural', 'Conventional', 'Mixed'];
const GROWTH_STAGES = ['Planned', 'Germination', 'Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Maturity', 'Harvested'];
const CROP_HEALTH = ['Healthy', 'Needs Attention', 'At Risk'];
const RESOURCE_CATEGORIES = ['Seeds', 'Fertilizers', 'Organic Products', 'Crop Care', 'Equipment', 'Irrigation'];
const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const CONSULTATION_STATUSES = ['Requested', 'Accepted', 'In Progress', 'Completed', 'Cancelled'];
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const POST_CATEGORIES = [
  'Crop Problems',
  'Farming Techniques',
  'Weather',
  'Pest & Disease',
  'Irrigation',
  'Harvest',
  'Market & Schemes',
  'General',
];
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
];
const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);
const SOIL_STATUSES = ['Excellent', 'Good', 'Moderate', 'Poor', 'Critical'];

// Forward-only order workflow; cancellation is possible until delivery.
const ORDER_TRANSITIONS = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: [],
};

module.exports = {
  SOIL_TYPES,
  IRRIGATION_TYPES,
  FARMING_TYPES,
  GROWTH_STAGES,
  CROP_HEALTH,
  RESOURCE_CATEGORIES,
  ORDER_STATUSES,
  CONSULTATION_STATUSES,
  RISK_LEVELS,
  POST_CATEGORIES,
  LANGUAGES,
  LANGUAGE_CODES,
  SOIL_STATUSES,
  ORDER_TRANSITIONS,
};
