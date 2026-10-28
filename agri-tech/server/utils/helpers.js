const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Case-insensitive "contains" regex built from untrusted user input.
const searchRegex = (text) => new RegExp(escapeRegex(String(text).trim()), 'i');

function getPagination(query, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

const buildMeta = (total, { page, limit }) => ({ total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) });

const isAdmin = (user) => user && user.role === 'admin';

// Farmers only ever see their own documents; admins see everything.
const ownerFilter = (user) => (isAdmin(user) ? {} : { owner: user._id });

function lastMonths(count) {
  const months = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString('en-IN', { month: 'short' }) });
  }
  return months;
}

module.exports = { escapeRegex, searchRegex, getPagination, buildMeta, isAdmin, ownerFilter, lastMonths };
