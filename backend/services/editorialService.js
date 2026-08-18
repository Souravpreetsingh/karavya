'use strict';

const db = require('../db');
const ProductService = require('./productService');

function hydrateStory(row) {
  if (!row) return null;
  const relatedIds = JSON.parse(row.related_product_ids_json || '[]');
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    description: row.description,
    content: row.content,
    imageUrl: row.image_url,
    publishedAt: row.published_at,
    relatedProducts: relatedIds.map((pid) => ProductService.findById(pid)).filter(Boolean),
  };
}

const EditorialService = {
  list({ limit = 20, offset = 0 } = {}) {
    const total = db.prepare('SELECT COUNT(*) AS c FROM editorial_stories WHERE published = 1').get().c;
    const rows = db.prepare('SELECT * FROM editorial_stories WHERE published = 1 ORDER BY published_at DESC LIMIT ? OFFSET ?')
      .all(limit, offset);
    return { items: rows.map(hydrateStory), total };
  },

  findBySlug(slug) {
    return hydrateStory(db.prepare('SELECT * FROM editorial_stories WHERE slug = ? AND published = 1').get(slug));
  },

  search(q, limit = 10) {
    const like = `%${q}%`;
    const rows = db.prepare("SELECT * FROM editorial_stories WHERE published = 1 AND (title LIKE ? OR description LIKE ? OR category LIKE ?) LIMIT ?")
      .all(like, like, like, limit);
    return rows.map(hydrateStory);
  },
};

module.exports = EditorialService;