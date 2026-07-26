# Memory Art — Backend (Part 1)

Node.js/Express + MongoDB API for the AI-Powered Personalized Memory Art platform.
This is **Part 1** of the build: project scaffold, database models, and authentication
+ memory upload. AI generation, the storefront frontend, and checkout come in later parts.

## What's included in this part

- Express app with centralized error handling
- MongoDB models: `User`, `Memory`, `Artwork`, `Product`, `Order`
- JWT-based auth: register, login, get/update profile
- Memory upload endpoints (photos + voice note via `multipart/form-data`, stored
  locally on disk for now — swapped for Cloudinary/S3 in Part 2)
- Verified: dependencies install clean (`npm audit` → 0 vulnerabilities), every
  file passes `node --check`, and the server boots and answers `/api/health`.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGO_URI and JWT_SECRET
npm run dev             # nodemon, or `npm start` for plain node
```

You need a MongoDB instance — either a free [MongoDB Atlas](https://www.mongodb.com/atlas)
cluster (recommended, works from anywhere) or a local `mongod`. Paste the
connection string into `MONGO_URI` in `.env`.

## API reference (Part 1)

| Method | Route                | Auth |  Description                          |
|--------|----------------------|------|---------------------------------------|
| GET    | `/api/health`        | –    | Health check                          |
| POST   | `/api/auth/register` | –    | `{ name, email, password, address? }` |
| POST   | `/api/auth/login`    | –    | `{ email, password }`                 |
| GET    | `/api/auth/me`       | ✅   | Current user profile                  |
| PUT    | `/api/auth/me`       | ✅   | Update name/address                   |
| POST   | `/api/memories`      | ✅   | Create memory (multipart: `photos[]`, `voiceNote`, `description`, `title`, `dates`, `location`) |
| GET    | `/api/memories`      | ✅   | List your memories                    |
| GET    | `/api/memories/:id`  | ✅   | Get one memory                        |
| PUT    | `/api/memories/:id`  | ✅   | Update title/description/location     |
| DELETE | `/api/memories/:id`  | ✅   | Delete a memory                       |

Authenticated requests need `Authorization: Bearer <token>` (token comes back
from register/login).

## Roadmap (next parts)

- **Part 2 — AI service (FastAPI + Grok API):** emotion detection, story/title
  generation, image generation, Cloudinary/S3 upload swap. Exposed internally
  and called from `POST /api/memories/:id/analyze` and a new `artworkRoutes.js`.
- **Part 3 — Frontend (React + Tailwind):** auth screens, memory upload flow,
  artwork preview/customizer, timeline view.
- **Part 4 — Storefront:** `Product`/`Order` routes, cart, checkout, gift preview
  mockups.
- **Part 5 — Extras:** Memory Capsule (scheduled reveal), collaborative memories,
  memory constellation view.

## Notes on the Grok API integration (coming in Part 2)

You mentioned using the Grok (xAI) API. It'll sit in `ai-service/` as its own
FastAPI app so it can be scaled/deployed independently of this Node backend,
which will call it over HTTP (`AI_SERVICE_URL` in `.env`). You'll need an xAI
API key (from https://console.x.ai) for that part — I can't reach x.ai from
this sandbox to test it live, so I'll hand you code you run with your own key.
