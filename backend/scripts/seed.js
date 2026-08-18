'use strict';

const crypto = require('crypto');
const db = require('../db');
require('../db/schema');
const { scryptHash } = require('../utils/crypto');
const config = require('../config');

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

const COLLECTIONS = [
  { slug: 'loungewear', name: 'Loungewear', description: 'For the days you never leave the house.' },
  { slug: 'robes', name: 'Robes', description: 'Dressing gowns and robes for the private hour.' },
  { slug: 'new-arrivals', name: 'New Arrivals', description: 'The latest pieces to arrive at the Maison.' },
  { slug: 'gifting', name: 'Gifting Studio', description: 'Curated gifts for the people you love.' },
  { slug: 'the-edit', name: 'The Edit', description: 'Evening and occasion dressing.' },
];

const P = (slug, name, price, cat, extra = {}) => ({
  slug, name,
  price_cents: price * 100,
  category: cat,
  ...extra,
});

const PRODUCTS = [
  P('cloudline-modal-set', 'Cloudline Modal Set', 2499, 'Loungewear', {
    compare_at_price_cents: 399900,
    description: 'Premium modal lounge set with soft-touch, breathable, relaxed fit.',
    material: 'Premium modal',
    colors: [{ name: 'Rose', hex: '#fcecef' }, { name: 'Cream', hex: '#fffdfd' }, { name: 'Espresso', hex: '#3d2c30' }, { name: 'Sand', hex: '#f4e2d8' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    stock: 24, collection: 'loungewear',
  }),
  P('rose-cloud-robe', 'Rose Cloud Robe', 2999, 'Robes', {
    compare_at_price_cents: 399900,
    description: 'Signature robe with removable waist tie, in-seam pockets and French seams.',
    material: '95% TENCEL Modal, 5% Spandex',
    colors: [{ name: 'Rose White', hex: '#FFF5F7' }, { name: 'Midnight Noir', hex: '#2B1B1F' }, { name: 'Taupe Mist', hex: '#896f62' }],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 30, collection: 'robes',
  }),
  P('serene-satin-coord', 'Serene Satin Co-Ord', 3498, 'Loungewear', {
    description: 'Fluid satin co-ord set.',
    material: 'Satin',
    colors: [{ name: 'Champagne', hex: '#E7C7B7' }, { name: 'Pearl', hex: '#F8DCE3' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: 18, collection: 'loungewear',
  }),
  P('satin-haze-set', 'Satin Haze Set', 4499, 'Robes', {
    description: 'Fluid satin evening lounge.',
    material: 'Satin',
    colors: [{ name: 'Deep Champagne', hex: '#D4C3B3' }],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 2, collection: 'robes', availability: 'low_stock',
  }),
  P('cloud-slippers', 'Cloud Slippers', 1299, 'Accessories', {
    description: 'Complete the ritual. Plush slippers in soft rose tones.',
    colors: [], sizes: [], stock: 40, collection: 'loungewear',
  }),
  P('aura-sleep-mist', 'Aura Sleep Mist', 899, 'Wellness', {
    description: 'A restful linen and room mist for the wind-down hour.',
    colors: [], sizes: [], stock: 50, collection: 'loungewear',
  }),
  P('ethereal-silk-robe', 'Ethereal Silk Robe', 5999, 'Robes', {
    description: 'An ethereal silk robe for the evening hour.',
    material: 'Silk',
    colors: [{ name: 'Rose White', hex: '#FFF5F7' }],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 12, collection: 'robes',
  }),
  P('breeze-linen-cami', 'Breeze Linen Cami', 1899, 'Loungewear', {
    description: 'Breeze linen camisole in warm neutrals.',
    material: 'Linen',
    colors: [{ name: 'Oatmeal', hex: '#f4e2d8' }],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 26, collection: 'loungewear',
  }),
  P('boyfriend-sleep-shirt', 'Boyfriend Sleep Shirt', 2199, 'Sleepwear', {
    description: 'A relaxed, easy sleep shirt.',
    colors: [{ name: 'Rose White', hex: '#FFF5F7' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: 20, collection: 'loungewear',
  }),
  P('sunday-robe-set', 'The Sunday Robe Set', 6499, 'Gifting', {
    description: 'The complete Sunday robe ritual, gift-wrapped.',
    colors: [{ name: 'Rose White', hex: '#FFF5F7' }],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 10, collection: 'gifting',
  }),
  P('pearl-edit', 'The Pearl Edit', 3899, 'Gifting', {
    description: 'A curated pearl-toned gift edit.',
    colors: [{ name: 'Pearl', hex: '#F8DCE3' }],
    sizes: [], stock: 15, collection: 'gifting',
  }),
  P('modal-lounge-set-the', 'The Modal Lounge Set', 5299, 'Gifting', {
    description: 'The premium modal lounge set, presented as a gift.',
    material: 'Modal',
    colors: [{ name: 'Rose', hex: '#fcecef' }, { name: 'Sand', hex: '#f4e2d8' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: 9, collection: 'gifting',
  }),
  P('silk-crepe-blouse', 'Silk Crepe Blouse', 4499, 'The Edit', {
    description: 'Heavy silk crepe blouse from the season lookbook.',
    material: 'Heavy silk crepe',
    colors: [{ name: 'Pearl Rose', hex: '#FCECEF' }],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 14, collection: 'the-edit',
  }),
  P('elysian-robe', 'The Elysian Robe', 7499, 'Robes', {
    description: 'The robe from the Art of Slow Living story.',
    material: 'Silk blend',
    colors: [{ name: 'Champagne', hex: '#E7C7B7' }],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 8, collection: 'robes',
  }),
  P('aura-lounge-set', 'Aura Lounge Set', 6499, 'Loungewear', {
    description: 'The Aura lounge set from the editorial story.',
    colors: [{ name: 'Rose White', hex: '#FFF5F7' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: 11, collection: 'loungewear',
  }),
  P('restoration-mask', 'Restoration Mask', 2499, 'Wellness', {
    description: 'An overnight restoration mask.',
    colors: [], sizes: [], stock: 32, collection: 'loungewear',
  }),
  P('rose-cloud-set', 'Rose Cloud Set', 3299, 'Loungewear', {
    description: 'Signature silk blend loungewear. Bestseller.',
    material: 'Silk blend',
    colors: [{ name: 'Rose', hex: '#fcecef' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: 21, collection: 'loungewear',
  }),
  P('midnight-edit-pj', 'Midnight Edit PJ Set', 2899, 'Sleepwear', {
    description: 'Classic piped sleepwear.',
    colors: [{ name: 'Midnight Noir', hex: '#2B1B1F' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: 0, collection: 'loungewear', availability: 'out_of_stock',
  }),
  P('bespoke-robe', 'The Bespoke Robe', 9499, 'Robes', {
    description: 'The bespoke robe from the season lookbook.',
    material: '100% Mulberry Silk',
    colors: [{ name: 'Champagne Rose', hex: '#E7C7B7' }],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 5, collection: 'the-edit',
  }),
  P('fluid-gown', 'The Fluid Gown', 12999, 'The Edit', {
    description: 'Ethereal slip dress with crossover straps.',
    material: 'Fluid satin',
    colors: [{ name: 'Pearl', hex: '#F8DCE3' }],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 6, collection: 'the-edit',
  }),
  P('modal-lounge-set', 'Modal Lounge Set', 2499, 'Loungewear', {
    description: 'Signature modal wrap with matching trousers.',
    material: 'Modal',
    colors: [{ name: 'Rose', hex: '#fcecef' }, { name: 'Sand', hex: '#f4e2d8' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: 28, collection: 'loungewear',
  }),
  P('silk-slip-dress', 'Silk Slip Dress', 3499, 'The Edit', {
    description: 'Fluid silk that catches candlelight.',
    material: 'Silk',
    colors: [{ name: 'Pearl', hex: '#F8DCE3' }],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 17, collection: 'the-edit',
  }),
  P('signature-modal-wrap', 'Signature Modal Wrap', 3299, 'Loungewear', {
    description: 'The signature modal wrap.',
    material: 'Modal',
    colors: [{ name: 'Rose White', hex: '#FFF5F7' }],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: 22, collection: 'loungewear',
  }),
  P('ethereal-cami-set', 'Ethereal Cami Set', 2199, 'Loungewear', {
    description: 'Cami set in ethereal tones.',
    colors: [{ name: 'Pearl', hex: '#F8DCE3' }],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 19, collection: 'loungewear',
  }),
  P('sunday-robe', 'The Sunday Robe', 4599, 'Robes', {
    description: 'The Sunday robe in soft champagne tones.',
    material: 'Silk blend',
    colors: [{ name: 'Champagne', hex: '#E7C7B7' }],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 13, collection: 'robes',
  }),
  P('minimal-crossbody', 'Minimalist Crossbody', 1500, 'Accessories', {
    description: 'Minimalist crossbody bag in deep espresso.',
    colors: [{ name: 'Deep Espresso', hex: '#2B1B1F' }],
    sizes: [], stock: 25, collection: 'the-edit',
  }),
  P('linen-resort-shirt', 'Linen Resort Shirt', 1499, 'Loungewear', {
    description: 'Linen resort shirt in oatmeal.',
    material: 'Linen',
    colors: [{ name: 'Oatmeal', hex: '#f4e2d8' }],
    sizes: ['S', 'M', 'L'],
    stock: 16, collection: 'loungewear',
  }),
];

const EDITORIAL = [
  {
    slug: 'the-art-of-slow-living',
    title: 'The Art of Slow Living',
    category: 'Journal',
    description: 'How to build an unhurried wardrobe - and why softness is a discipline.',
    content: 'An essay on slow living, evening rituals, and the pieces that anchor them.',
    relatedProductSlugs: ['elysian-robe', 'aura-lounge-set', 'restoration-mask'],
  },
];

const LOOKBOOKS = [
  {
    slug: 'the-season-in-motion',
    title: 'The Season, In Motion',
    description: 'The KARAVYA season captured in two looks.',
    looks: [
      { title: 'Look 01', description: 'The Bespoke Robe in motion.', productSlugs: ['bespoke-robe', 'silk-crepe-blouse'] },
      { title: 'Look 02', description: 'The Fluid Gown for evening.', productSlugs: ['fluid-gown'] },
    ],
  },
];

function seed() {
  const ts = now();
  const existing = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  if (existing > 0) {
    console.log('Database already seeded (%d products). Skipping.', existing);
    return;
  }

  const insCollection = db.prepare('INSERT INTO collections (id, slug, name, description, image_url, published, sort_order) VALUES (?, ?, ?, ?, ?, 1, ?)');
  const insProduct = db.prepare(`INSERT INTO products (id, slug, name, description, material, price_cents, compare_at_price_cents, currency, category, collection_id, image_url, colors_json, sizes_json, availability, stock, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'INR', ?, ?, '', ?, ?, ?, ?, ?, ?)`);

  db.exec('BEGIN');
  try {
    const collIds = {};
    COLLECTIONS.forEach((c, i) => {
      const cid = id();
      collIds[c.slug] = cid;
      insCollection.run(cid, c.slug, c.name, c.description, '', i);
    });

    const insEditorial = db.prepare('INSERT INTO editorial_stories (id, slug, title, category, description, content, image_url, published, published_at, related_product_ids_json) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)');
    const insLookbook = db.prepare('INSERT INTO lookbooks (id, slug, title, description, published) VALUES (?, ?, ?, ?, 1)');
    const insLook = db.prepare('INSERT INTO lookbook_looks (id, lookbook_id, title, description, image_url, product_ids_json, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');

    for (const p of PRODUCTS) {
      const pid = id();
      const collectionId = p.collection ? collIds[p.collection] : null;
      insProduct.run(pid, p.slug, p.name, p.description || '', p.material || '', p.price_cents,
        p.compare_at_price_cents || null, p.category, collectionId,
        JSON.stringify(p.colors || []), JSON.stringify(p.sizes || []), p.availability || 'in_stock', p.stock || 0, ts, ts);
      const bySlug = {};
      bySlug[p.slug] = pid;
      if (p.slug === 'elysian-robe') EDITORIAL[0]._ids = { elysian: pid };
      if (p.slug === 'aura-lounge-set') EDITORIAL[0]._ids = { ...EDITORIAL[0]._ids, aura: pid };
      if (p.slug === 'restoration-mask') EDITORIAL[0]._ids = { ...EDITORIAL[0]._ids, mask: pid };
      if (p.slug === 'bespoke-robe') LOOKBOOKS[0]._ids = { ...LOOKBOOKS[0]._ids, bespoke: pid };
      if (p.slug === 'silk-crepe-blouse') LOOKBOOKS[0]._ids = { ...LOOKBOOKS[0]._ids, blouse: pid };
      if (p.slug === 'fluid-gown') LOOKBOOKS[0]._ids = { ...LOOKBOOKS[0]._ids, gown: pid };
    }

    const slugToId = {};
    for (const row of db.prepare('SELECT id, slug FROM products').all()) slugToId[row.slug] = row.id;

    for (const e of EDITORIAL) {
      const eid = id();
      const related = e.relatedProductSlugs.map((s) => slugToId[s]).filter(Boolean);
      insEditorial.run(eid, e.slug, e.title, e.category, e.description, e.content, '', ts, JSON.stringify(related));
    }

    for (const lb of LOOKBOOKS) {
      const lid = id();
      insLookbook.run(lid, lb.slug, lb.title, lb.description);
      lb.looks.forEach((l, i) => {
        insLook.run(id(), lid, l.title, l.description, '', JSON.stringify(l.productSlugs.map((s) => slugToId[s]).filter(Boolean)), i);
      });
    }

    if (config.admin.email && config.admin.password) {
      const insUser = db.prepare('INSERT INTO users (id, email, password_hash, first_name, last_name, phone, email_verified, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)');
      insUser.run(id(), config.admin.email, scryptHash(config.admin.password), 'KARAVYA', 'Admin', '', 'admin', ts, ts);
      console.log('Admin user created: %s', config.admin.email);
    }

    db.exec('COMMIT');
    console.log('Seeded: %d collections, %d products, %d editorial stories, %d lookbooks', COLLECTIONS.length, PRODUCTS.length, EDITORIAL.length, LOOKBOOKS.length);
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed, PRODUCTS, COLLECTIONS };