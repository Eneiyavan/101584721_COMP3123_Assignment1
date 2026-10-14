// Vercel serverless entry point: connect to MongoDB (cached), then hand off to Express.
const connectDB = require('../src/config/db');
const app = require('../src/app');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    return res.status(503).json({ status: 'error', message: 'Database unavailable' });
  }
  return app(req, res);
};
