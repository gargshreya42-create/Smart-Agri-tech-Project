const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const SENSITIVE_KEY = /pass(word)?|token|secret|authorization|api[-_]?key|cookie/i;

const activeLevel = process.env.NODE_ENV === 'production' ? LEVELS.info : LEVELS.debug;

function redact(value, depth = 0) {
  if (value === null || typeof value !== 'object' || depth > 3) return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([key, val]) => [key, SENSITIVE_KEY.test(key) ? '[REDACTED]' : redact(val, depth + 1)])
  );
}

function write(level, message, meta) {
  if (LEVELS[level] > activeLevel) return;
  const line = `${new Date().toISOString()} [${level.toUpperCase()}] ${message}`;
  const out = meta ? `${line} ${JSON.stringify(redact(meta))}` : line;
  (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(out);
}

module.exports = {
  error: (message, meta) => write('error', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  info: (message, meta) => write('info', message, meta),
  debug: (message, meta) => write('debug', message, meta),
};
