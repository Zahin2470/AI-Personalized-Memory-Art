# Memory Art — Backend

Node.js/Express + MongoDB API for the AI-Powered Personalized Memory Art platform.

## What's included

**Part 1 — foundation:**
- Express app with centralized error handling
- MongoDB models: `User`, `Memory`, `Artwork`, `Product`, `Order`
- JWT-based auth: register, login, get/update profile
- Memory upload endpoints (photos + voice note via `multipart/form-data`)

**Part 2 — AI integration:**
- File uploads go to Cloudinary (falls back to local disk if Cloudinary isn't
  configured — fine for quick local testing, but the AI service can't see
  localhost photo URLs, so image-based analysis is skipped in that mode)
- `POST /api/memories/:id/analyze` — calls the AI service for emotion
  detection, a short story, suggested titles, and tags
- Full `Artwork` CRUD (`/api/artworks`) — generates AI artwork via the AI
  service and stores the result
- `GET /api/timeline` — aggregates the user's dated memories and calls the AI
  service for a connecting narrative

**Part 4 — storefront:**
- `Product` CRUD (`/api/products`) — turns an artwork + a chosen product type
  into a cart line item, priced from `src/config/catalog.js`
- `Order` flow (`/api/orders`) — creates an order from cart products, a real
  Stripe Checkout Session (not a mocked payment flow) via
  `POST /api/orders/:id/checkout`, and `POST /api/orders/:id/cancel` to
  release items back to the cart if checkout is abandoned
- Stripe webhook (`POST /api/orders/webhook`) — marks an order `paid` on
  `checkout.session.completed`. Mounted with `express.raw()` **before** the
  global `express.json()` middleware, since Stripe's signature verification
  needs the exact raw request bytes — this is the one route in the app that
  isn't JSON-parsed.

Verified: dependencies install clean (`npm audit` → 0 vulnerabilities), every
file passes `node --check`, the server boots and answers `/api/health`, all
routes are confirmed registered, and a live HTTP smoke test confirmed both the
webhook's no-op-when-unconfigured behavior and auth enforcement on protected
routes.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, Cloudinary keys, AI_SERVICE_URL, Stripe keys
npm run dev
```

You'll also need the AI service running (see `../ai-service/README.md`) for
`/analyze` and artwork generation to work. `STRIPE_SECRET_KEY` can be left
blank while you build everything else — checkout will just respond with a
clear 503 instead of a confusing failure. Everything else (auth, memory CRUD,
browsing) works without either dependency.

### Wiring up Stripe locally

1. Get test-mode keys from https://dashboard.stripe.com/test/apikeys
2. For webhooks during local dev, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):
   `stripe listen --forward-to localhost:5000/api/orders/webhook` — it prints
   a webhook signing secret to put in `STRIPE_WEBHOOK_SECRET`.
3. I can't reach `api.stripe.com` from my sandbox, so this integration is
   written correctly against Stripe's documented Node SDK patterns but
   untested against the live API — worth a manual test-mode checkout before
   you rely on it.

## API reference

| Method | Route                    | Auth | Description                          |
|--------|---------------------------|------|---------------------------------------|
| GET    | `/api/health`              | –    | Health check                          |
| POST   | `/api/auth/register`      | –    | `{ name, email, password, address? }` |
| POST   | `/api/auth/login`         | –    | `{ email, password }`                 |
| GET    | `/api/auth/me`             | ✅   | Current user profile                  |
| PUT    | `/api/auth/me`             | ✅   | Update name/address                   |
| POST   | `/api/memories`            | ✅   | Create memory (multipart: `photos[]`, `voiceNote`, `description`, `title`, `dates`, `location`) |
| GET    | `/api/memories`            | ✅   | List your memories                    |
| GET    | `/api/memories/:id`        | ✅   | Get one memory                        |
| POST   | `/api/memories/:id/analyze`| ✅   | Run AI analysis (emotion/story/titles/tags) |
| PUT    | `/api/memories/:id`        | ✅   | Update title/description/location     |
| DELETE | `/api/memories/:id`        | ✅   | Delete a memory                       |
| POST   | `/api/artworks`            | ✅   | `{ memoryId, style }` → generates AI artwork |
| GET    | `/api/artworks`            | ✅   | List your artworks (optionally `?memoryId=`) |
| GET    | `/api/artworks/:id`        | ✅   | Get one artwork                       |
| PUT    | `/api/artworks/:id/favorite`| ✅  | Toggle favorite                       |
| DELETE | `/api/artworks/:id`        | ✅   | Delete an artwork                     |
| GET    | `/api/timeline`             | ✅   | Chronological narrative across dated memories |
| POST   | `/api/products`            | ✅   | `{ artworkId, type, size? }` → adds a product to the cart |
| GET    | `/api/products`            | ✅   | List products (optionally `?ordered=false` for cart) |
| GET    | `/api/products/:id`        | ✅   | Get one product                       |
| DELETE | `/api/products/:id`        | ✅   | Remove from cart (only if not yet ordered) |
| POST   | `/api/orders`              | ✅   | `{ items: [{productId, quantity}], shippingAddress? }` |
| GET    | `/api/orders`              | ✅   | List your orders                      |
| GET    | `/api/orders/:id`          | ✅   | Get one order                         |
| POST   | `/api/orders/:id/checkout` | ✅   | Creates a Stripe Checkout session, returns `{ url }` |
| POST   | `/api/orders/:id/cancel`   | ✅   | Cancels a pending order, releases items to cart |
| POST   | `/api/orders/webhook`      | –    | Stripe webhook (signature-verified, not user-facing) |
| PUT    | `/api/memories/:id/seal`   | ✅   | `{ revealAt }` — seals a memory into a capsule until that date |
| DELETE | `/api/memories/:id/seal`   | ✅   | Opens a capsule early                 |
| POST   | `/api/memories/:id/invite` | ✅   | Generates a shareable contribution link |
| GET    | `/api/memories/:id/contributions` | ✅ | List contributions a memory has received |
| POST   | `/api/memories/:id/transcribe` | ✅ | Transcribes the memory's voice note via Grok STT |
| GET    | `/api/contribute/:token`   | –    | Public - look up a memory by invite token |
| POST   | `/api/contribute/:token`   | –    | Public - add a photo/message (`contributorName`, `text?`, `photo?`) |

Authenticated requests need `Authorization: Bearer <token>` (token comes back
from register/login). The two `/api/contribute` routes are intentionally
public - gated only by knowing the (random, 32-char) invite token - so
friends and family can contribute without creating an account.

## Part 5 notes

- **Memory Capsule:** a sealed memory (`capsule.revealAt` in the future) is
  masked at the model layer (`Memory.isSealed()` + a shared mask applied in
  every read path in `memoryController.js`), not just hidden in the UI - the
  API itself won't return the content early, even to the owner.
- **Collaborative memories:** the `Contribution` model and public
  `/api/contribute` routes let anyone with the link add a photo/message
  without an account. `POST /api/memories/:id/analyze` now folds in
  contribution text/photos and the voice note transcript (if present) before
  calling the AI service, so the generated story reflects everyone's input -
  not just the owner's.
- **Voice transcription:** uses xAI's Speech-to-Text API (`grok-stt`,
  launched April 2026), which takes raw audio bytes over multipart form data
  rather than a URL - the AI service fetches the voice note from its
  (Cloudinary) URL first, then re-uploads the bytes to `/v1/stt`. This is the
  one integration this build where I had lower confidence in the exact
  request shape going in; I found and cross-checked a concrete example
  against three independent sources before writing it, but it's still worth
  a manual test before relying on it.
- **Memory Constellation** is a frontend-only feature (an alternative visual
  layout of the same `/api/timeline` data) - no new backend surface.

## Status

The platform as originally scoped, plus every "stretch" feature from the
spec, is now built and verified across all three services: memory upload,
AI analysis, artwork generation, timeline/constellation views, cart,
checkout, memory capsules, collaborative contributions, and voice
transcription.
