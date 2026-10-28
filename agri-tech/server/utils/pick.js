// Copies only the listed keys (when present) — keeps mass-assignment of unexpected fields out of the database.
module.exports = (source, keys) =>
  keys.reduce((result, key) => {
    if (source[key] !== undefined) result[key] = source[key];
    return result;
  }, {});
