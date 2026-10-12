const logger = require('../utils/logger');

// Logs one line per request when the response finishes.
// Never logs bodies, headers or query strings (no passwords/tokens).
module.exports = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger.log(level, 'HTTP request', {
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip,
    });
  });
  next();
};
