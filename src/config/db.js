const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

// Strip any $-operators from query filters (basic NoSQL-injection protection)
mongoose.set('sanitizeFilter', true);

let connectionPromise = null;

/**
 * Connects once and reuses the connection. Reuse matters on Vercel,
 * where the same function instance handles many invocations.
 */
async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 })
      .then((m) => {
        logger.info('MongoDB connected', { db: m.connection.name });
        return m.connection;
      })
      .catch((err) => {
        connectionPromise = null;
        logger.error('MongoDB connection failed', { message: err.message });
        throw err;
      });
  }
  return connectionPromise;
}

module.exports = connectDB;
