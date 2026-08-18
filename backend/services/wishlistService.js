'use strict';

const db = require('../db');
const crypto = require('crypto');
const { AppError } = require('../utils/errors');
const ProductService = require('./productService');

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

function getOrCreateWishlist(userId) {
  let wl = db.prepare('SELECT * FROM wishlists WHERE user_id = ?').get(userId);
  if (!wl) {
    const wid = id();
    db.prepare('INSERT INTO wishlists (id, user_id, created_at) VALUES (?, ?, ?)').run(wid, userId, now());
    wl = { id: wid };
  }
  return wl;
}

const WishlistService = {
  get(userId) {
    const wl = getOrCreateWishlist(userId);
    const rows = db.prepare('SELECT product_id, created_at FROM wishlist_items WHERE wishlist_id = ? ORDER BY created_at DESC').all(wl.id);
    const items = rows
      .map((r) => ProductService.findById(r.product_id))
      .filter(Boolean);
    return { items };
  },

  add(userId, productId) {
    const product = ProductService.findById(productId);
    if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    const wl = getOrCreateWishlist(userId);
    const existing = db.prepare('SELECT id FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?').get(wl.id, productId);
    if (!existing) {
      db.prepare('INSERT INTO wishlist_items (id, wishlist_id, product_id, created_at) VALUES (?, ?, ?, ?)').run(id(), wl.id, productId, now());
    }
    return WishlistService.get(userId);
  },

  remove(userId, productId) {
    const wl = getOrCreateWishlist(userId);
    db.prepare('DELETE FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?').run(wl.id, productId);
    return WishlistService.get(userId);
  },

  toggle(userId, productId) {
    const wl = getOrCreateWishlist(userId);
    const existing = db.prepare('SELECT id FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?').get(wl.id, productId);
    if (existing) {
      db.prepare('DELETE FROM wishlist_items WHERE id = ?').run(existing.id);
      return { saved: false };
    }
    const product = ProductService.findById(productId);
    if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    db.prepare('INSERT INTO wishlist_items (id, wishlist_id, product_id, created_at) VALUES (?, ?, ?, ?)').run(id(), wl.id, productId, now());
    return { saved: true };
  },

  mergeGuest(userId, guestProductIds) {
    for (const productId of guestProductIds) {
      try {
        WishlistService.add(userId, productId);
      } catch (err) {
        if (err instanceof AppError && err.code === 'PRODUCT_NOT_FOUND') continue;
        throw err;
      }
    }
    return WishlistService.get(userId);
  },
};

module.exports = WishlistService;