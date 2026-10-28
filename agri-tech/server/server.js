const mongoose = require('mongoose');
const { port } = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const logger = require('./utils/logger');

async function start() {
  try {
    await connectDB();
  } catch (err) {
    logger.error('Could not connect to MongoDB. Is it running and is MONGODB_URI correct?', { message: err.message });
    process.exit(1);
  }

  const server = app.listen(port, () => logger.info(`Smart Agri-Tech API listening on http://localhost:${port}`));

  const shutdown = (signal) => {
    logger.info(`${signal} received — shutting down`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => logger.error('Unhandled promise rejection', { reason: String(reason) }));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — exiting', { message: err.message });
  process.exit(1);
});

start();
