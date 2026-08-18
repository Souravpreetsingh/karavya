'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const config = require('./config');
const createSessionStore = require('./db/sessionStore');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./utils/errors');
const logger = require('./utils/logger');

require('./db/schema');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const quizRoutes = require('./routes/quizRoutes');
const fitRoutes = require('./routes/fitRoutes');
const giftRoutes = require('./routes/giftRoutes');
const orderRoutes = require('./routes/orderRoutes');
const returnRoutes = require('./routes/returnRoutes');
const addressRoutes = require('./routes/addressRoutes');
const editorialRoutes = require('./routes/editorialRoutes');
const lookbookRoutes = require('./routes/lookbookRoutes');

function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(apiLimiter());

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  const sessionStore = createSessionStore(config.sessionTtlMs);
  app.use(
    session({
      name: 'kaya.sid',
      store: sessionStore,
      secret: config.authSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.isProd,
        maxAge: config.sessionTtlMs,
      },
    })
  );

  app.use(express.json({ limit: '64kb' }));

  const api = express.Router();

  api.get('/health', (req, res) => {
    res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } });
  });

  api.use('/auth', authRoutes);
  api.use('/users', userRoutes);
  api.use('/products', productRoutes);
  api.use('/collections', collectionRoutes);
  api.use('/cart', cartRoutes);
  api.use('/wishlist', wishlistRoutes);
  api.use('/quiz', quizRoutes);
  api.use('/fit', fitRoutes);
  api.use('/gifting', giftRoutes);
  api.use('/orders', orderRoutes);
  api.use('/returns', returnRoutes);
  api.use('/addresses', addressRoutes);
  api.use('/editorial', editorialRoutes);
  api.use('/lookbook', lookbookRoutes);

  app.use('/api', api);

  const frontendDir = path.resolve(__dirname, '..');
  app.use((req, res, next) => {
    if (req.path.startsWith('/backend') || req.path.includes('node_modules') || req.path.includes('.env')) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } });
    }
    next();
  });
  app.use(express.static(frontendDir, { index: 'index.html', extensions: ['html'], dotfiles: 'deny' }));
  app.get('/favicon.ico', (req, res) => {
    const svg = path.join(frontendDir, 'favicon.svg');
    if (fs.existsSync(svg)) {
      res.type('image/svg+xml').set('Cache-Control', 'public, max-age=86400').sendFile(svg);
    } else {
      res.status(204).end();
    }
  });

  app.use(notFound);
  app.use(errorHandler);

  return { app, sessionStore };
}

module.exports = createApp;