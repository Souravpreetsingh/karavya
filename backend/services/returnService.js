'use strict';

const db = require('../db');
const crypto = require('crypto');
const { AppError } = require('../utils/errors');

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

const RETURN_POLICY = {
  windowDays: 30,
  summary:
    'We accept returns within 30 days of delivery. Items must be unworn, unwashed, and have original tags attached. A complimentary pickup service is included for all members.',
  refund: 'Refunds are processed within 3-5 business days of receipt and inspection, to the original method of payment.',
  exchange: "Exchanges are available online - select 'Exchange' during the return flow to browse available sizes and colours. The replacement item ships once your return is scanned by the courier.",
};

function hydrate(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderId: row.order_id,
    reason: row.reason,
    items: JSON.parse(row.items_json || '[]'),
    status: row.status,
    refundStatus: row.refund_status,
    trackingRef: row.tracking_ref,
    createdAt: row.created_at,
  };
}

const ReturnService = {
  policy() {
    return RETURN_POLICY;
  },

  create(userId, { orderId, reason = '', items = [] }) {
    if (!items.length) throw new AppError(400, 'NO_ITEMS', 'Select at least one item to return');
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
    if (order.user_id !== userId) throw new AppError(403, 'FORBIDDEN', 'You do not have access to this order');
    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
    for (const it of items) {
      const match = orderItems.find((oi) => oi.id === it.orderItemId);
      if (!match) throw new AppError(400, 'INVALID_ITEM', 'One of the selected items is not part of this order');
      if (it.quantity < 1 || it.quantity > match.quantity) {
        throw new AppError(400, 'INVALID_QUANTITY', 'Return quantity exceeds the ordered quantity');
      }
    }
    const rid = id();
    db.prepare(`INSERT INTO return_requests (id, user_id, order_id, reason, items_json, status, refund_status, tracking_ref, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'requested', 'not_started', '', ?, ?)`)
      .run(rid, userId, orderId, reason, JSON.stringify(items), now(), now());
    return hydrate(db.prepare('SELECT * FROM return_requests WHERE id = ?').get(rid));
  },

  listForUser(userId) {
    const rows = db.prepare('SELECT * FROM return_requests WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    return rows.map(hydrate);
  },

  findById(userId, returnId) {
    const row = db.prepare('SELECT * FROM return_requests WHERE id = ?').get(returnId);
    if (!row) throw new AppError(404, 'RETURN_NOT_FOUND', 'Return request not found');
    if (row.user_id !== userId) throw new AppError(403, 'FORBIDDEN', 'You do not have access to this return');
    return hydrate(row);
  },
};

module.exports = ReturnService;