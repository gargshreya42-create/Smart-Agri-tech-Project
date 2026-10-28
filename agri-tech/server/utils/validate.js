const AppError = require('./AppError');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+]?[0-9\s-]{10,15}$/;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const isEmpty = (value) => value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

/**
 * Validates one value against a rule. Returns { value } (coerced) or { error }.
 * Rule keys: required, type (string|email|phone|number|integer|date|boolean|array|objectId),
 * min, max, minLength, maxLength, enum, label, pattern, message, itemType.
 */
function checkValue(raw, rule, label) {
  const { type = 'string' } = rule;
  let value = raw;

  switch (type) {
    case 'string':
    case 'email':
    case 'phone':
    case 'objectId': {
      if (typeof value !== 'string') return { error: `${label} must be text.` };
      value = value.trim();
      if (type === 'email') {
        value = value.toLowerCase();
        if (!EMAIL_PATTERN.test(value)) return { error: 'Please enter a valid email address.' };
      }
      if (type === 'phone' && !PHONE_PATTERN.test(value)) return { error: 'Please enter a valid phone number (10–15 digits).' };
      if (type === 'objectId' && !OBJECT_ID_PATTERN.test(value)) return { error: `${label} is not valid.` };
      if (rule.minLength && value.length < rule.minLength) return { error: `${label} must be at least ${rule.minLength} characters.` };
      if (rule.maxLength && value.length > rule.maxLength) return { error: `${label} must be at most ${rule.maxLength} characters.` };
      if (rule.enum && !rule.enum.includes(value)) return { error: `${label} must be one of: ${rule.enum.join(', ')}.` };
      if (rule.pattern && !rule.pattern.test(value)) return { error: rule.message || `${label} is not in the expected format.` };
      return { value };
    }
    case 'number':
    case 'integer': {
      if (typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '')) return { error: `${label} must be a number.` };
      const num = Number(value);
      if (!Number.isFinite(num)) return { error: `${label} must be a number.` };
      if (type === 'integer' && !Number.isInteger(num)) return { error: `${label} must be a whole number.` };
      if (rule.min !== undefined && num < rule.min) return { error: `${label} must be at least ${rule.min}.` };
      if (rule.max !== undefined && num > rule.max) return { error: `${label} must be at most ${rule.max}.` };
      return { value: num };
    }
    case 'date': {
      const date = new Date(value);
      if (typeof value === 'object' && !(value instanceof Date)) return { error: `${label} must be a valid date.` };
      if (Number.isNaN(date.getTime())) return { error: `${label} must be a valid date.` };
      return { value: date };
    }
    case 'boolean': {
      if (value === true || value === 'true') return { value: true };
      if (value === false || value === 'false') return { value: false };
      return { error: `${label} must be true or false.` };
    }
    case 'array': {
      if (!Array.isArray(value)) return { error: `${label} must be a list.` };
      const cleaned = [];
      for (const item of value) {
        if (typeof item !== 'string') return { error: `${label} must only contain text values.` };
        const trimmed = item.trim();
        if (trimmed) cleaned.push(trimmed);
      }
      if (rule.required && cleaned.length === 0) return { error: `${label} is required.` };
      if (rule.maxItems && cleaned.length > rule.maxItems) return { error: `${label} can have at most ${rule.maxItems} items.` };
      return { value: cleaned };
    }
    default:
      return { value };
  }
}

/**
 * Express middleware factory. Validates (and coerces) req.body according to a schema.
 * With { partial: true } absent fields are skipped, which suits PUT/PATCH updates.
 */
const validateBody = (schema, { partial = false } = {}) => (req, res, next) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const errors = {};

  Object.entries(schema).forEach(([field, rule]) => {
    const label = rule.label || field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
    const raw = body[field];
    const absent = raw === undefined;

    if (partial && absent) return;

    if (isEmpty(raw)) {
      if (rule.required) {
        errors[field] = `${label} is required.`;
        return;
      }
      // Optional + empty: free-text fields may be cleared with '', typed fields (enum/date/number/id) are simply ignored.
      const typed = rule.enum || ['date', 'number', 'integer', 'objectId', 'boolean'].includes(rule.type);
      if (typed || raw === null) delete body[field];
      else body[field] = '';
      return;
    }

    const result = checkValue(raw, rule, label);
    if (result.error) errors[field] = result.error;
    else body[field] = result.value;
  });

  if (Object.keys(errors).length) {
    return next(new AppError(422, 'Please correct the highlighted fields.', errors));
  }
  req.body = body;
  return next();
};

const validateObjectId = (param = 'id') => (req, res, next) => {
  if (!OBJECT_ID_PATTERN.test(String(req.params[param] || ''))) {
    return next(new AppError(400, 'The requested record ID is not valid.'));
  }
  return next();
};

const PASSWORD_RULE = {
  required: true,
  minLength: 8,
  maxLength: 72,
  pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
  message: 'Password must contain at least one letter and one number.',
};

module.exports = { validateBody, validateObjectId, PASSWORD_RULE, checkValue };
