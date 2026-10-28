const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { clientUrls, nodeEnv } = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');
const AppError = require('./utils/AppError');
const logger = require('./utils/logger');

const app = express();

app.disable('x-powered-by');
if (nodeEnv === 'production') app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header (Postman, curl, server-to-server) are allowed.
      if (!origin || clientUrls.includes(origin)) return callback(null, true);
      return callback(new AppError(403, 'This origin is not allowed by the CORS policy.'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '100kb' }));

if (nodeEnv !== 'production') {
  app.use((req, res, next) => {
    const started = Date.now();
    res.on('finish', () => logger.debug(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`));
    next();
  });
}

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
