'use strict';

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function page(items, total, limit, offset) {
  return {
    items,
    total,
    limit,
    offset,
    hasMore: offset + items.length < total,
  };
}

function parsePagination(query, maxLimit = 50) {
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), maxLimit);
  const offset = Math.max(Number(query.offset) || 0, 0);
  return { limit, offset };
}

module.exports = { ok, page, parsePagination };