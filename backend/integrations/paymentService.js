'use strict';

const config = require('../config');
const { AppError } = require('../utils/errors');

/**
 * Payment gateway abstraction - foundation only.
 * No real payments are processed in this phase. When PAYMENT_PROVIDER
 * (razorpay|stripe) is configured in a later phase, the real gateway
 * integration lands here. Webhooks will update order status server-side.
 */
const PaymentService = {
  isConfigured() {
    return Boolean(config.payment.provider && config.payment.secret);
  },

  async createPaymentIntent({ order, user }) {
    if (!PaymentService.isConfigured()) {
      throw new AppError(501, 'PAYMENT_GATEWAY_NOT_CONFIGURED', 'Online payments are not configured yet');
    }
    // Future gateway implementation: create intent, return client secret + provider ref.
    throw new AppError(501, 'PAYMENT_GATEWAY_NOT_CONFIGURED', 'Online payments are not configured yet');
  },

  async verifyWebhookSignature(rawBody, signature) {
    // Future: verify gateway webhook signature before trusting it.
    void rawBody;
    void signature;
    return false;
  },
};

module.exports = PaymentService;