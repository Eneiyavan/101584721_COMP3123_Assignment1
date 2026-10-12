const config = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const app = require('./app');

(async () => {
  try {
    await connectDB();
    app.listen(config.port, () => {
      logger.info('Server started', { port: config.port, env: config.nodeEnv });
    });
  } catch (err) {
    logger.error('Failed to start server', { message: err.message });
    process.exit(1);
  }
})();
