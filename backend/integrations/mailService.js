'use strict';

const config = require('../config');
const logger = require('../utils/logger');

/**
 * Email delivery abstraction.
 * If EMAIL_HOST is configured, transport is expected to be wired (SMTP).
 * Until then, outbound emails are logged to the console in development only.
 */
const MailService = {
  async send({ to, subject, text, html }) {
    const payload = { to, subject, text, html };
    if (config.email.host) {
      // TODO: attach a real SMTP transport (e.g. nodemailer) here in a later phase.
      logger.warn('EMAIL_TRANSPORT_NOT_CONFIGURED', { to, subject });
      return { delivered: false, mode: 'pending' };
    }
    if (config.env === 'production') {
      logger.warn('EMAIL_NOT_DELIVERED_PRODUCTION', { to, subject });
      return { delivered: false, mode: 'blocked' };
    }
    logger.info('DEV_EMAIL', payload);
    return { delivered: false, mode: 'dev' };
  },

  sendPasswordReset(to, resetLink) {
    return MailService.send({
      to,
      subject: 'Reset your KARAVYA password',
      text: `We received a request to reset your KARAVYA password.\n\nUse this link within 1 hour: ${resetLink}\n\nIf you did not request this, you can safely ignore this email.`,
    });
  },

  sendWelcome(to, firstName) {
    return MailService.send({
      to,
      subject: 'Welcome to KARAVYA',
      text: `Welcome to the Maison, ${firstName}. Your private wardrobe awaits.`,
    });
  },
};

module.exports = MailService;