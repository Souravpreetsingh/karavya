'use strict';

const db = require('../db');
const { AppError } = require('../utils/errors');

function hydrate(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    material: row.material,
    price: { amount: row.price_cents / 100, cents: row.price_cents, currency: row.currency },
    compareAtPrice: row.compare_at_price_cents
      ? { amount: row.compare_at_price_cents / 100, cents: row.compare_at_price_cents, currency: row.currency }
      : null,
    category: row.category,
    collectionId: row.collection_id,
    imageUrl: row.image_url,
    colors: JSON.parse(row.colors_json || '[]'),
    sizes: JSON.parse(row.sizes_json || '[]'),
    availability: row.availability,
    stock: row.stock,
    inStock: row.availability === 'in_stock' || (row.availability === 'low_stock' && row.stock > 0),
  };
}

const ProductService = {
  findById(id) {
    return hydrate(db.prepare('SELECT * FROM products WHERE id = ?').get(id));
  },

  findBySlug(slug) {
    return hydrate(db.prepare('SELECT * FROM products WHERE slug = ?').get(slug));
  },

  list({ limit = 20, offset = 0, category, collectionId, minPriceCents, maxPriceCents, color, size, availability, sort, q }) {
    const where = ['1=1'];
    const params = [];
    if (q) {
      where.push('(name LIKE ? OR description LIKE ? OR category LIKE ? OR material LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    if (category) { where.push('category = ?'); params.push(category); }
    if (collectionId) { where.push('collection_id = ?'); params.push(collectionId); }
    if (minPriceCents !== undefined) { where.push('price_cents >= ?'); params.push(minPriceCents); }
    if (maxPriceCents !== undefined) { where.push('price_cents <= ?'); params.push(maxPriceCents); }
    if (availability === 'in_stock') { where.push("availability != 'out_of_stock'"); }
    if (availability === 'out_of_stock') { where.push("availability = 'out_of_stock'"); }
    if (color) { where.push('colors_json LIKE ?'); params.push(`%"${color}"%`); }
    if (size) { where.push('sizes_json LIKE ?'); params.push(`"${size}"`); }

    const orderBy = sort === 'price_asc' ? 'price_cents ASC'
      : sort === 'price_desc' ? 'price_cents DESC'
      : sort === 'newest' ? 'created_at DESC'
      : 'name ASC';

    const total = db.prepare(`SELECT COUNT(*) AS c FROM products WHERE ${where.join(' AND ')}`).get(...params).c;
    const rows = db.prepare(
      `SELECT * FROM products WHERE ${where.join(' AND ')} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);
    return { items: rows.map(hydrate), total };
  },

  related(productId, limit = 4) {
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!p) return [];
    const rows = db.prepare(
      `SELECT * FROM products WHERE id != ? AND (collection_id = ? OR category = ?) AND availability != 'out_of_stock' ORDER BY name LIMIT ?`
    ).all(productId, p.collection_id, p.category, limit);
    return rows.map(hydrate);
  },

  byCollection(collectionId, { limit = 20, offset = 0 } = {}) {
    const total = db.prepare('SELECT COUNT(*) AS c FROM products WHERE collection_id = ?').get(collectionId).c;
    const rows = db.prepare('SELECT * FROM products WHERE collection_id = ? ORDER BY name LIMIT ? OFFSET ?')
      .all(collectionId, limit, offset);
    return { items: rows.map(hydrate), total };
  },

  assertAvailable(product) {
    if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    if (product.availability === 'out_of_stock' || product.stock <= 0) {
      throw new AppError(409, 'OUT_OF_STOCK', 'That piece is currently unavailable');
    }
    return product;
  },

  assertSize(product, size) {
    if (size && product.sizes.length && !product.sizes.includes(size)) {
      throw new AppError(400, 'INVALID_SIZE', `Size ${size} is not available for this piece`);
    }
    if (!size && product.sizes.length) {
      throw new AppError(400, 'SIZE_REQUIRED', 'Please select a size');
    }
  },

  assertColor(product, color) {
    if (color && product.colors.length && !product.colors.some((c) => c.name.toLowerCase() === color.toLowerCase())) {
      throw new AppError(400, 'INVALID_COLOR', `Color ${color} is not available for this piece`);
    }
  },
};

module.exports = ProductService;