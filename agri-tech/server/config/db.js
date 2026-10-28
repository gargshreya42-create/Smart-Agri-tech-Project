const mongoose = require('mongoose');
const { mongoUri } = require('./env');
const logger = require('../utils/logger');

mongoose.set('strictQuery', true);

async function connectDB() {
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  mongoose.connection.on('error', (err) => logger.error('MongoDB connection error', { message: err.message }));

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
  logger.info('MongoDB connected', { database: mongoose.connection.name });
}

module.exports = connectDB;
