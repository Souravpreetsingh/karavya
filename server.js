'use strict';

const config = require('./backend/config');
const createApp = require('./backend/app');
const logger = require('./backend/utils/logger');
const { seed } = require('./backend/scripts/seed');

const { app, sessionStore } = createApp();

if (process.env.VERCEL || config.isProd) {
  seed();
}

if (require.main === module) {
  const server = app.listen(config.port, () => {
    logger.info('KARAVYA backend listening', { port: config.port, env: config.env });
  });

  setInterval(() => {
    if (sessionStore && typeof sessionStore.clearExpired === 'function') sessionStore.clearExpired();
  }, 60 * 60 * 1000).unref();

  process.on('SIGTERM', () => server.close(() => process.exit(0)));
  process.on('SIGINT', () => server.close(() => process.exit(0)));
}

module.exports = app;
