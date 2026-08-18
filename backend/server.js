'use strict';

const config = require('./config');
const { app, sessionStore } = require('./app')();
const logger = require('./utils/logger');

const server = app.listen(config.port, () => {
  logger.info('KARAVYA backend listening', { port: config.port, env: config.env });
});

setInterval(() => {
  if (sessionStore && typeof sessionStore.clearExpired === 'function') sessionStore.clearExpired();
}, 60 * 60 * 1000).unref();

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));