'use strict';

const db = require('../db');
const ProductService = require('./productService');

function hydrateLookbook(row) {
  if (!row) return null;
  const looks = db.prepare('SELECT * FROM lookbook_looks WHERE lookbook_id = ? ORDER BY sort_order').all(row.id).map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    imageUrl: l.image_url,
    products: JSON.parse(l.product_ids_json || '[]').map((pid) => ProductService.findById(pid)).filter(Boolean),
  }));
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    looks,
  };
}

const LookbookService = {
  list() {
    const rows = db.prepare('SELECT * FROM lookbooks WHERE published = 1 ORDER BY title').all();
    return rows.map(hydrateLookbook);
  },

  findBySlug(slug) {
    return hydrateLookbook(db.prepare('SELECT * FROM lookbooks WHERE slug = ? AND published = 1').get(slug));
  },
};

module.exports = LookbookService;