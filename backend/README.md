# KARAVYA Backend

Real Node.js API for the KARAVYA storefront. Node >= 22.5 (built and tested on v26.1.0), zero native dependencies — SQLite via `node:sqlite`.

## Stack

- **Express 4** + `express-session` (SQLite-backed sessions, HttpOnly cookie `kaya.sid`)
- **SQLite** (`node:sqlite`, WAL mode, foreign keys) — no ORM, plain prepared statements
- **zod 3** — request validation (strips unknown fields; mass-assignment safe)
- **helmet**, **cors** (credentials), **express-rate-limit** (auth 10/min, API 120/min per IP)
- **node:crypto** — scrypt password hashing, token hashing (reset tokens stored hashed)
- Tests: `node:test` built-in runner, no extra dependencies

## Quick start

```bash
cd backend
npm install
npm run seed        # idempotent; seeds 5 collections, 27 products, editorial + lookbook
npm start           # http://localhost:3000
npm test            # 65 tests (uses ./data/test.db automatically)
```

## Configuration

Copy `.env.example` to `.env`. Key variables:

| Variable | Default | Notes |
|---|---|---|
| `PORT` | 3000 | |
| `DATABASE_PATH` | `./data/karavya.db` | `./data/test.db` in tests |
| `AUTH_SECRET` | `change-me-to-a-long-random-string` | **MUST be changed in production** |
| `SESSION_TTL_MS` | 604800000 (7 days) | |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated |
| `FRONTEND_URL` | `http://localhost:3000` | Used for reset-password links |
| `RATE_LIMIT_MAX` / `AUTH_RATE_LIMIT_MAX` | 120 / 10 | |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | — | Seeded as admin role user by `npm run seed` |
| `SHIPPING_FLAT_CENTS` | 50000 (₹500) | Free shipping ≥ `SHIPPING_FREE_THRESHOLD_CENTS` (500000) |
| `TAX_RATE` | 0.05 | |
| `AI_PROVIDER` / `AI_MODEL` / `AI_API_KEY` | — | KAYA concierge (next phase) |
| `PAYMENT_PROVIDER` / `PAYMENT_API_KEY` | — | Payments are `501 NOT_IMPLEMENTED` until a gateway is configured |

## Project layout

```
backend/
  app.js                  express app assembly (helmet, cors, session, routes, error handling)
  server.js               boot entry
  config/index.js         env parsing + defaults
  db/
    index.js              node:sqlite connection (WAL)
    schema.js             all tables + indexes
    sessionStore.js       SQLite session store (express-session compatible)
  middleware/
    auth.js               requireAuth / loadUser / requireRole
    validate.js           zod adapter
    rateLimit.js          per-IP limiters
  validators/schemas.js   zod schemas
  services/               business logic (users, products, cart, wishlist, orders,
                          style quiz, fit, gifting, addresses, returns, editorial, lookbook)
  routes/                 thin HTTP layer per domain
  integrations/
    mailService.js        dev console transport (pluggable SMTP later)
    paymentService.js     stub — 501 until gateway configured
  utils/                  errors, apiResponse, crypto, logger
  scripts/seed.js         real catalog seed (idempotent, exports seed())
  test/                   65 tests across 6 files (node:test)
  API.md                  endpoint reference
```

## Security notes

- Passwords: scrypt with per-user salt; reset tokens stored as SHA-256 hashes.
- Sessions: server-side SQLite store, HttpOnly + SameSite=Lax cookie, 7-day TTL.
- Authorization: ownership checks on orders/returns/addresses/cart items (IDOR tested); admin-only status updates; `role` cannot be changed by clients.
- Errors: 5xx responses never leak stack traces or internals.
- Rate limiting on all API routes, stricter on auth.
- JSON body capped at 64kb.

## Roadmap (next phases)

1. Payment gateway integration (replace `integrations/paymentService.js` stub).
2. KAYA AI Style Concierge: AI provider abstraction + tool registry over the existing services.
3. Real product photography → `image_url` (currently seeded empty; frontend uses local placeholder images).
4. Email transport (SMTP) behind `integrations/mailService.js`.