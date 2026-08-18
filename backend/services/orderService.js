'use strict';

const db = require('../db');
const crypto = require('crypto');
const config = require('../config');
const { AppError } = require('../utils/errors');
const CartService = require('./cartService');
const ProductService = require('./productService');

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

const ORDER_STATUSES = ['placed', 'confirmed', 'preparing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'refunded'];

function hydrateOrder(row) {
  if (!row) return null;
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(row.id).map((i) => ({
    id: i.id,
    productId: i.product_id,
    name: i.product_name,
    size: i.size,
    color: i.color,
    quantity: i.quantity,
    unitPrice: { amount: i.unit_price_cents / 100, cents: i.unit_price_cents, currency: row.currency },
  }));
  return {
    id: row.id,
    userId: row.user_id,
    orderNumber: row.order_number,
    items,
    totals: {
      subtotal: row.subtotal_cents / 100,
      discount: row.discount_cents / 100,
      shipping: row.shipping_cents / 100,
      tax: row.tax_cents / 100,
      total: row.total_cents / 100,
      currency: row.currency,
    },
    status: row.status,
    paymentStatus: row.payment_status,
    paymentReference: row.payment_reference,
    shippingAddress: JSON.parse(row.shipping_address_json || '{}'),
    billingAddress: JSON.parse(row.billing_address_json || '{}'),
    createdAt: row.created_at,
  };
}

function nextOrderNumber() {
  const row = db.prepare("SELECT order_number FROM orders ORDER BY created_at DESC LIMIT 1").get();
  const seq = row ? parseInt(String(row.order_number).replace('KR-', ''), 10) + 1 : 847291;
  return `KR-${seq}`;
}

function computeTotals(subtotalCents) {
  const shippingCents = subtotalCents >= config.shipping.freeThresholdCents || subtotalCents === 0
    ? 0
    : config.shipping.flatCents;
  const taxCents = Math.round(subtotalCents * config.shipping.taxRate);
  return {
    subtotalCents,
    discountCents: 0,
    shippingCents,
    taxCents,
    totalCents: subtotalCents + shippingCents + taxCents,
  };
}

const OrderService = {
  async createFromCart(userId, { shippingAddress, billingAddress, paymentReference = '' }) {
    const cart = CartService.get(userId);
    if (!cart.items.length) throw new AppError(400, 'EMPTY_CART', 'Your bag is empty');

    for (const item of cart.items) {
      const product = ProductService.assertAvailable(ProductService.findById(item.productId));
      ProductService.assertSize(product, item.size);
      if (product.stock > 0 && item.quantity > product.stock) {
        throw new AppError(409, 'QUANTITY_EXCEEDS_STOCK', `Only ${product.stock} of ${product.name} available`);
      }
    }

    const subtotalCents = cart.items.reduce((s, i) => s + i.unitPrice.cents * i.quantity, 0);
    const t = computeTotals(subtotalCents);
    const orderId = id();
    const orderNumber = nextOrderNumber();

    db.exec('BEGIN');
    try {
      db.prepare(`INSERT INTO orders (id, user_id, order_number, subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents, currency, status, payment_status, payment_reference, shipping_address_json, billing_address_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'INR', 'placed', 'pending', ?, ?, ?, ?, ?)`)
        .run(orderId, userId, orderNumber, t.subtotalCents, t.discountCents, t.shippingCents, t.taxCents, t.totalCents,
          paymentReference, JSON.stringify(shippingAddress || {}), JSON.stringify(billingAddress || shippingAddress || {}), now(), now());

      const insItem = db.prepare('INSERT INTO order_items (id, order_id, product_id, product_name, size, color, quantity, unit_price_cents) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      for (const item of cart.items) {
        const product = ProductService.findById(item.productId);
        insItem.run(id(), orderId, item.productId, product.name, item.size, item.color, item.quantity, product.price.cents);
      }
      CartService.clear(userId);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    return OrderService.findById(orderId);
  },

  findById(orderId) {
    return hydrateOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId));
  },

  findByNumber(orderNumber) {
    return hydrateOrder(db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber));
  },

  listForUser(userId, { limit = 20, offset = 0 } = {}) {
    const total = db.prepare('SELECT COUNT(*) AS c FROM orders WHERE user_id = ?').get(userId).c;
    const rows = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(userId, limit, offset);
    return { items: rows.map(hydrateOrder), total };
  },

  assertOwner(order, userId) {
    if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
    if (order.userId !== userId) throw new AppError(403, 'FORBIDDEN', 'You do not have access to this order');
    return order;
  },

  updateStatus(orderId, status, { paymentStatus, paymentReference } = {}) {
    if (!ORDER_STATUSES.includes(status)) throw new AppError(400, 'INVALID_STATUS', 'Invalid order status');
    if (paymentStatus && !PAYMENT_STATUSES.includes(paymentStatus)) throw new AppError(400, 'INVALID_PAYMENT_STATUS', 'Invalid payment status');
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!row) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
    db.prepare('UPDATE orders SET status = ?, payment_status = COALESCE(?, payment_status), payment_reference = COALESCE(?, payment_reference), updated_at = ? WHERE id = ?')
      .run(status, paymentStatus || null, paymentReference || null, now(), orderId);
    return OrderService.findById(orderId);
  },

  markPaid(orderId, paymentReference) {
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!row) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
    db.prepare('UPDATE orders SET payment_status = ?, payment_reference = ?, status = ?, updated_at = ? WHERE id = ?')
      .run('paid', paymentReference, 'confirmed', now(), orderId);
    return OrderService.findById(orderId);
  },
};

module.exports = OrderService;