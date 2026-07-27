<div align="center">

# 🎨 Memory Art

**Turn a photo, a voice note, or a date you haven't forgotten into a one-of-one illustrated piece.**

An AI-powered platform that reads the mood in a personal memory and transforms it into gallery-worthy art — watercolor, oil, pencil sketch, and more — ready to preview, gift, or buy as a print, canvas, mug, or memory book.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white&style=flat-square)](https://nodejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi&logoColor=white&style=flat-square)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white&style=flat-square)](https://www.mongodb.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)](https://tailwindcss.com)
[![Grok API](https://img.shields.io/badge/AI-Grok_(xAI)-000000?style=flat-square)](https://x.ai)
[![SSLCommerz](https://img.shields.io/badge/Payments-SSLCommerz-1E3A8A?style=flat-square)](https://www.sslcommerz.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)](#license)

</div>

---

## What this is

Someone uploads a memory — a photo, a few lines about what happened, maybe a
voice note or a date they don't want to lose. The platform reads the mood in
it (joy, nostalgia, celebration, peace...), writes a short story, suggests a
title, and generates original artwork in the style of their choosing.
From there it's a real storefront: preview the piece framed on a wall, on a
mug, or bound into a book, add it to a cart, and check out.

Built as three independent services — a React frontend, a Node/Express API,
and a Python/FastAPI AI service wrapping the Grok API — so each can be
developed, deployed, and scaled on its own.

## ✨ Features

**Core flow**
- 📤 Upload a memory — photos, a voice note, text, and important dates
- 🧠 AI analysis — mood detection, a curated color palette, a short story,
  suggested titles, and tags
- 🖌️ Artwork generation — 7 styles: watercolor, minimalist, oil painting,
  pencil sketch, vintage poster, pop art, abstract collage
- 🛒 Storefront — gift-preview mockups, cart, real checkout via SSLCommerz
  (cards, bKash, Nagad, Rocket, internet banking), order history
- 📜 Timeline — a chronological narrative woven across all your dated
  memories

**Extras**
- ⏳ **Memory Capsule** — seal a memory to reopen on a future date (an
  anniversary, a birthday); enforced at the API layer, not just hidden in
  the UI
- 🤝 **Collaborative Memories** — share an invite link so friends and family
  can add their own photos and messages, no account required — their
  contributions feed into the AI-generated story
- 🎙️ **Voice Transcription** — a loved one's voice note, transcribed and
  folded into the memory's analysis
- ✨ **Memory Constellation** — the same memories laid out as an organic
  radial star map instead of a list

## 🖼️ Preview

> _Add a few screenshots or a short screen recording here once you've run
> it locally — the landing page's gallery-wall hero and the artwork
> generation flow are the best ones to show off._

## 🏗️ Architecture

```mermaid
flowchart LR
    subgraph Client
        FE["Frontend<br/>React + Tailwind"]
    end
    subgraph Server
        BE["Backend API<br/>Node + Express + MongoDB"]
        AI["AI Service<br/>FastAPI"]
    end
    subgraph External
        GROK["Grok API<br/>(xAI)"]
        CLOUD["Cloudinary"]
        SSL["SSLCommerz<br/>(cards + bKash/Nagad/Rocket)"]
    end

    FE -->|REST + JWT| BE
    BE -->|internal HTTP| AI
    AI -->|analyze / generate / transcribe| GROK
    BE -->|photo / voice uploads| CLOUD
    AI -->|re-host generated art| CLOUD
    BE -->|checkout sessions + IPN| SSL
```

## 🛠️ Tech stack

| Layer         | Stack |
|---------------|-------|
| **Frontend**  | React 19, React Router, Tailwind CSS v4, Axios, Vite |
| **Backend**   | Node.js, Express, MongoDB (Mongoose), JWT auth, Multer |
| **AI Service**| Python, FastAPI, httpx, Grok API (chat, vision, image generation, speech-to-text) |
| **Storage**   | Cloudinary (photos, voice notes, generated artwork) |
| **Payments**  | SSLCommerz (cards + bKash/Nagad/Rocket/internet banking), BDT |

## 📁 Project structure

```
memory-art-platform/
├── frontend/       React app — everything the user sees and clicks
├── backend/        Express API — auth, memories, artworks, orders, capsules
└── ai-service/     FastAPI service — all Grok API calls live here
```

Each folder has its own `README.md` with full setup steps and API
reference — this file is the map; those are the manuals.

## 🚀 Getting started

**Prerequisites:** Node.js 20+, Python 3.11+, a MongoDB instance (local or
[Atlas](https://www.mongodb.com/atlas)), an [xAI API key](https://console.x.ai).
Cloudinary and SSLCommerz keys are optional to start — everything runs
without them, just with uploads falling back to local disk and checkout
returning a clear "not configured" message instead of a confusing failure.
[SSLCommerz sandbox signup](https://developer.sslcommerz.com) is free and
instant. Note that SSLCommerz's callbacks POST directly to your backend, so
testing checkout end-to-end locally needs a public tunnel (e.g.
[ngrok](https://ngrok.com)) — see `backend/README.md` for the exact steps.

Start all three services, in this order (each one calls the one before it):

```bash
# 1. AI service
cd ai-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your XAI_API_KEY
uvicorn app.main:app --reload --port 8000

# 2. Backend
cd backend
npm install
cp .env.example .env   # MONGO_URI, JWT_SECRET, AI_SERVICE_URL, etc.
npm run dev             # http://localhost:5000

# 3. Frontend
cd frontend
npm install
cp .env.example .env   # VITE_API_URL
npm run dev             # http://localhost:5173
```

Then open `http://localhost:5173` and create an account.

## 📡 API overview

Full endpoint references live in each service's README. At a glance:

| Service | Base path | Highlights |
|---------|-----------|------------|
| Backend | `/api` | `/auth`, `/memories`, `/artworks`, `/products`, `/orders`, `/orders/sslcommerz/*`, `/timeline`, `/contribute` |
| AI Service | `/` | `/analyze`, `/artwork/generate`, `/timeline`, `/transcribe` |

## 🗺️ Status

The platform is feature-complete against its original spec, including every
"stretch" feature: memory upload, AI analysis, artwork generation, a real
storefront with SSLCommerz checkout (cards, bKash, Nagad, Rocket, internet
banking), memory capsules, collaborative contributions, voice transcription,
and the constellation view.

Built with heavy use of Claude — every piece was verified along the way
(clean installs, dependency audits, syntax/lint checks, boot tests) rather
than taken on faith. One real example: the official SSLCommerz npm package
was dropped after `npm audit` surfaced an unfixable CRLF-injection advisory
in one of its dependencies — the integration calls SSLCommerz's REST API
directly instead. See the per-service READMEs for what's been verified
versus what's written-correctly-but-untested against live third-party APIs
(Grok, Cloudinary, and SSLCommerz aren't reachable from a sandboxed build
environment).

## 📄 License

MIT — see [`LICENSE`](./LICENSE), or replace this section with whatever fits
your repo.
