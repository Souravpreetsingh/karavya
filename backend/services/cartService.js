'use strict';

const db = require('../db');
const crypto = require('crypto');
const config = require('../config');
const { AppError } = require('../utils/errors');
const ProductService = require('./productService');

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

function getOrCreateCart(userId) {
  let cart = db.prepare('SELECT * FROM carts WHERE user_id = ?').get(userId);
  if (!cart) {
    const cartId = id();
    db.prepare('INSERT INTO carts (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run(cartId, userId, now(), now());
    cart = { id: cartId };
  }
  return cart;
}

function hydrateItem(row) {
  const product = ProductService.findById(row.product_id);
  return {
    id: row.id,
    productId: row.product_id,
    name: product ? product.name : '(unavailable piece)',
    slug: product ? product.slug : '',
    size: row.size,
    color: row.color,
    quantity: row.quantity,
    unitPrice: product ? product.price : null,
    availability: product ? product.availability : 'out_of_stock',
    imageUrl: product ? product.imageUrl : '',
  };
}

function totals(items) {
  const subtotalCents = items.reduce((s, i) => s + (i.unitPrice ? i.unitPrice.cents * i.quantity : 0), 0);
  const shippingCents = subtotalCents >= config.shipping.freeThresholdCents || subtotalCents === 0
    ? 0
    : config.shipping.flatCents;
  const taxCents = Math.round(subtotalCents * config.shipping.taxRate);
  return {
    subtotalCents,
    shippingCents,
    taxCents,
    totalCents: subtotalCents + shippingCents + taxCents,
    items: items.length,
  };
}

function money(cents) {
  return { amount: cents / 100, cents, currency: 'INR' };
}

const CartService = {
  get(userId) {
    const cart = getOrCreateCart(userId);
    const rows = db.prepare('SELECT * FROM cart_items WHERE cart_id = ? ORDER BY created_at').all(cart.id);
    const items = rows.map(hydrateItem).filter((i) => i.unitPrice);
    const t = totals(items);
    return {
      items,
      currency: 'INR',
      subtotal: money(t.subtotalCents),
      shipping: money(t.shippingCents),
      tax: money(t.taxCents),
      total: money(t.totalCents),
    };
  },

  addItem(userId, { productId, size = '', color = '', quantity = 1 }) {
    const product = ProductService.assertAvailable(ProductService.findById(productId));
    ProductService.assertSize(product, size);
    ProductService.assertColor(product, color);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new AppError(400, 'INVALID_QUANTITY', 'Quantity must be between 1 and 10');
    }
    if (product.stock > 0 && quantity > product.stock) {
      throw new AppError(409, 'QUANTITY_EXCEEDS_STOCK', `Only ${product.stock} available`);
    }
    const cart = getOrCreateCart(userId);
    const existing = db.prepare('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? AND size = ? AND color = ?')
      .get(cart.id, productId, size, color);
    if (existing) {
      const qty = existing.quantity + quantity;
      if (product.stock > 0 && qty > product.stock) throw new AppError(409, 'QUANTITY_EXCEEDS_STOCK', `Only ${product.stock} available`);
      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(qty, existing.id);
    } else {
      db.prepare('INSERT INTO cart_items (id, cart_id, product_id, size, color, quantity, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id(), cart.id, productId, size, color, quantity, now());
    }
    db.prepare('UPDATE carts SET updated_at = ? WHERE id = ?').run(now(), cart.id);
    return CartService.get(userId);
  },

  updateItem(userId, itemId, { quantity }) {
    const cart = getOrCreateCart(userId);
    const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND cart_id = ?').get(itemId, cart.id);
    if (!item) throw new AppError(404, 'CART_ITEM_NOT_FOUND', 'Item not in your bag');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new AppError(400, 'INVALID_QUANTITY', 'Quantity must be between 1 and 10');
    }
    const product = ProductService.findById(item.product_id);
    if (product && product.stock > 0 && quantity > product.stock) {
      throw new AppError(409, 'QUANTITY_EXCEEDS_STOCK', `Only ${product.stock} available`);
    }
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, itemId);
    return CartService.get(userId);
  },

  removeItem(userId, itemId) {
    const cart = getOrCreateCart(userId);
    db.prepare('DELETE FROM cart_items WHERE id = ? AND cart_id = ?').run(itemId, cart.id);
    return CartService.get(userId);
  },

  clear(userId) {
    const cart = getOrCreateCart(userId);
    db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);
    return CartService.get(userId);
  },

  mergeGuest(userId, guestItems) {
    for (const item of guestItems) {
      try {
        CartService.addItem(userId, item);
      } catch (err) {
        if (err instanceof AppError && (err.code === 'OUT_OF_STOCK' || err.code === 'PRODUCT_NOT_FOUND' || err.code === 'INVALID_SIZE')) continue;
        throw err;
      }
    }
    return CartService.get(userId);
  },
};

module.exports = CartService;