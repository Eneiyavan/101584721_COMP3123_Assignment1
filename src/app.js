const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');

const requestLogger = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const userRoutes = require('./routes/userRoutes');
const empRoutes = require('./routes/empRoutes');

const app = express();

// Needed so rate limiting sees the real client IP behind Vercel's proxy
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet()); // security headers
app.use(requestLogger);
app.use(express.json({ limit: '10kb' }));

// Health check (no auth, not rate limited)
app.get('/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const db = states[mongoose.connection.readyState] || 'unknown';
  res.status(200).json({
    status: 'ok',
    service: 'comp3123-assignment1',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database: db,
  });
});

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'COMP 3123 Assignment 1 API. See /health and /api/v1/*' });
});

app.use('/api', apiLimiter);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/emp', empRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
