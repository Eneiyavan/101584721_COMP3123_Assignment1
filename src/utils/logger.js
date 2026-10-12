const path = require('path');
const fs = require('fs');
const winston = require('winston');

const isVercel = Boolean(process.env.VERCEL);
const logDir = path.join(__dirname, '..', '..', 'logs');

const transports = [new winston.transports.Console()];

// Vercel's filesystem is read-only, so file logging is local-only.
if (!isVercel) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
    transports.push(
      new winston.transports.File({ filename: path.join(logDir, 'app.log') }),
      new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' })
    );
  } catch (err) {
    // fall back to console only
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: false }),
    winston.format.json()
  ),
  transports,
});

module.exports = logger;
