# KARAVYA Backend API

Base URL: `http://localhost:3000/api` (configurable via `PORT`).

## Conventions

- All responses are JSON envelopes: `{ "success": true, "data": { ... } }` or `{ "success": false, "error": { "code", "message", "details?" } }`.
- Error codes: `VALIDATION_ERROR` (400), `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `EMAIL_TAKEN` (409), `OUT_OF_STOCK` (409), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500).
- Authentication: cookie `kaya.sid` (HttpOnly, SameSite=Lax). Set automatically on register/login.
- Pagination: `?limit=` (default 20, max 100) and `?offset=`. List responses: `{ items, total, limit, offset, hasMore }`.
- Money: `price: { amount, cents, currency }`, currency `INR` throughout.
- Unknown JSON fields are stripped by validation (role escalation, `user_id` injection, etc. are rejected/ignored).

## Health

`GET /api/health` — service status, uptime, database check.

## Auth

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account. Body: `firstName`, `lastName?`, `email`, `password` (8+ chars, letter+number), `phone?`, `guestCart?` `[{productId,size,color,quantity}]`, `guestWishlist?` `[productId]`. Returns `user`, merged `cart`, `wishlist`. |
| POST | `/auth/login` | Body: `email`, `password`, optional `guestCart`/`guestWishlist` (merged into account). |
| POST | `/auth/logout` | Destroys session. |
| GET | `/auth/me` | Current user. |
| POST | `/auth/forgot-password` | Body: `email`. Always returns `{sent:true}` (no account enumeration). |
| POST | `/auth/reset-password` | Body: `token`, `newPassword`. |

Rate limits: auth endpoints 10 req/min/IP, general API 120 req/min/IP (configurable).

## Products

| Method | Path | Description |
|---|---|---|
| GET | `/products` | List. Filters: `q` (search name/description/category), `category`, `collection`, `minPrice`, `maxPrice`, `availability` (`in_stock`/`low_stock`/`out_of_stock`), `sizes`, `colors`, `sort` (`price_asc`/`price_desc`/`newest`). |
| GET | `/products/search?q=` | Dedicated search endpoint. |
| GET | `/products/:id` | Detail: colors, sizes, stock, availability, related products. |
| GET | `/collections` | All collections. |
| GET | `/collections/:id` | Collection detail. |
| GET | `/collections/:id/products` | Products in a collection (paginated). |

## Cart

All require auth.

| Method | Path | Description |
|---|---|---|
| GET | `/cart` | Current cart with server-side totals (`subtotal`, `shipping`, `tax`, `total`). |
| POST | `/cart/items` | Body: `productId`, `size?`, `color?`, `quantity` (1–10). Server validates size/color/stock; `unitPrice` from client is ignored. |
| PATCH | `/cart/items/:id` | Body: `quantity`. |
| DELETE | `/cart/items/:id` | Remove item. |
| DELETE | `/cart` | Clear cart. |

## Wishlist

All require auth. Product IDs must exist (404 otherwise).

| Method | Path | Description |
|---|---|---|
| GET | `/wishlist` | List. |
| POST | `/wishlist/items` | Body: `productId`. |
| DELETE | `/wishlist/items/:productId` | Remove. |
| POST | `/wishlist/toggle` | Body: `productId`. Returns `{ items, total, saved }`. |

## Orders

All require auth (status update requires admin).

| Method | Path | Description |
|---|---|---|
| GET | `/orders` | Current user's orders, newest first. |
| POST | `/orders` | Create from cart. Body: `shippingAddress` `{fullName, phone, line1, line2?, city, state, pincode}`, `billingAddress?`, `paymentReference?`. Clears cart, snapshots item names/prices. Totals: shipping ₹500 flat, free ≥ ₹5,000; tax 5%. Order number `KR-847291+`. |
| GET | `/orders/:id` | Owner only (403 otherwise). |
| PATCH | `/orders/:id/status` | Admin. Body: `status` (placed/confirmed/preparing/packed/shipped/out_for_delivery/delivered/cancelled), `paymentStatus?`, `paymentReference?`. |

## Style Quiz

| Method | Path | Description |
|---|---|---|
| POST | `/quiz/style-profile` | Body: `answers` (map of question id → answer id), `quizVersion?`. Returns profile with resolved archetype (muse / golden / quiet / playful) and matched products. |
| GET | `/quiz/style-profile` | Current profile. |
| PATCH | `/quiz/style-profile` | Update answers. |

## Fit Studio

| Method | Path | Description |
|---|---|---|
| POST | `/fit/fit-profile` | Body: `heightCm`, `weightKg`, `sizePreference`, `measurements?` `{bust, waist, hips}`. |
| GET | `/fit/fit-profile` | Current profile (null if none). |
| DELETE | `/fit/fit-profile` | Remove profile. |

## Gifting

| Method | Path | Description |
|---|---|---|
| POST | `/gifting/gift-preferences` | Body: `occasion`, `recipientType`, `budgetMin?`, `budgetMax?`, `stylePreferences?`. |
| GET | `/gifting/gift-recommendations` | Query: `budgetMax?`, `occasion?`, `recipientType?`, `limit?`. Prefers Gifting Studio pieces, falls back to in-stock catalog. |

## Addresses

| Method | Path | Description |
|---|---|---|
| GET | `/addresses` | List. |
| POST | `/addresses` | Create (first address becomes default; only one default). |
| PATCH | `/addresses/:id` | Update (`isDefault` toggles). |
| DELETE | `/addresses/:id` | Delete. |

## Returns

Real store policy: 30 days from delivery, unworn/unwashed/original tags, complimentary pickup for members, refunds to original payment method in 3–5 business days.

| Method | Path | Description |
|---|---|---|
| GET | `/returns/policy` | Policy text + window. |
| GET | `/returns` | My return requests. |
| POST | `/returns` | Body: `orderId`, `reason`, `items` `[{orderItemId, quantity}]` (max = ordered qty; order must be owned; not already returned). |
| GET | `/returns/:id` | Owner only (403 otherwise). |

## Users

| Method | Path | Description |
|---|---|---|
| GET | `/users/me` | Profile. |
| PATCH | `/users/me` | Update `firstName?`, `lastName?`, `phone?`, `preferredSize?`, `preferredFit?`, `styleProfile?`. `role` and `id` are ignored. |

## Editorial & Lookbook

| Method | Path | Description |
|---|---|---|
| GET | `/editorial` | Published stories. |
| GET | `/editorial/:slug` | Story with resolved related products. |
| GET | `/lookbook` | Published lookbooks. |
| GET | `/lookbook/:slug` | Lookbook with looks and resolved products. |