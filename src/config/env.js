require('dotenv').config();

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  // Fail fast: never run with missing secrets
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isVercel: Boolean(process.env.VERCEL),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  authRateLimit: {
    windowMs: (parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MIN, 10) || 15) * 60 * 1000,
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20,
  },
  apiRateLimit: {
    windowMs: (parseInt(process.env.API_RATE_LIMIT_WINDOW_MIN, 10) || 15) * 60 * 1000,
    max: parseInt(process.env.API_RATE_LIMIT_MAX, 10) || 100,
  },
};
