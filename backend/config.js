module.exports = {
  port: 3000,
  env: 'development',
  corsOrigins: ['http://localhost:3000', 'http://localhost:5173'],
  sessionTtlMs: 24 * 60 * 60 * 1000, // 24 hours
  authSecret: 'karavya-secret-key-123',
  isProd: false,
  databasePath: 'D:\\germents website\\backend\\data\\karavya.db',
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    authMax: 10 // limit each IP to 10 attempts per windowMs for auth
  }
};