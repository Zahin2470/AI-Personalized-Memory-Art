# Memory Art — Frontend

React + Tailwind CSS v4 frontend for the AI-Powered Personalized Memory Art platform.

## Design direction

The whole product is "your memories become gallery-worthy art," so the UI is built
around one idea: everything — the hero, the style picker, the artwork gallery — is
presented as a small, framed piece with a museum placard underneath
(`src/components/FramedArt.jsx`). That component is the one visual idea the app
reuses everywhere instead of decorating each page differently.

- **Palette:** ink (deep charcoal-navy) + parchment (mounted-print surface) + brass
  (gold-leaf accent) + emerald (a second, cooler accent, used sparingly) — see the
  `@theme` block in `src/index.css`.
- **Type:** Instrument Serif (italic display headlines) + Manrope (body) + IBM Plex
  Mono (uppercase, letter-spaced "placard" labels — nav items, form labels, section
  eyebrows).
- **Motion:** see "Ambient motion system" below.

## Ambient motion system

The interface uses a layered but restrained motion system rather than a
static one — framed pieces drift gently, controls give tactile feedback on
hover, and the hero has a cursor-parallax effect. Deliberately **not**
applied to text or form inputs — moving targets are a real usability problem
(harder to click, harder to read), so those stay stable and rely on
transitions (color/shadow/focus-glow) instead of position changes.

- **Ambient float** (`.animate-ambient-float` in `src/index.css`) — a slow
  (4.5–6s), small (±7px + a fraction of a degree) bob + tilt, applied to
  every `FramedArt` instance by default. Staggered per-instance via an
  `index` prop (delay + duration both vary with it) so a grid of these
  doesn't bob in unison — pass `float={false}` to opt a specific instance
  out (e.g. `MemoryDetail` disables it on a style card while that style is
  actively generating, as a visual "working" cue).
- **Hover lift** (`.frame-shadow` in `src/index.css`) — every framed piece
  lifts slightly and its shadow deepens on hover, independent of the ambient
  float (they're deliberately on different DOM nodes so the two `transform`
  sources don't fight each other in the CSS cascade — see the note below).
  Buttons get the same treatment (`Button.jsx`) plus a press-down state on
  click. Nav links get an underline that grows in from the left
  (`.link-underline`).
- **Ambient background blobs** (`AmbientBlobs` in `Landing.jsx`) — soft,
  slow-drifting blurred color fields behind the hero and pricing sections,
  always `pointer-events-none` and behind content.
- **Cursor parallax** — the hero gallery wall shifts subtly toward the
  cursor, each piece at a different depth for a layered feel. Disabled
  entirely (listener never attached) when `prefers-reduced-motion: reduce`
  is set, checked once via `matchMedia` on mount.

**A real bug worth knowing about, in case you extend this:** nested
`rotate()` transforms compose/add — an element rotated 6° containing a child
also rotated 6° renders at ~12°, not 6°. The hero pieces originally hit
this: the settle-in wrapper and `FramedArt`'s own tilt were both applying
the same rotation on nested elements, which would have doubled the visible
tilt angle. Fixed by making the settle-in keyframes handle only
fade/rise/scale, with `FramedArt` as the sole owner of rotation. If you add
another rotating layer, keep this in mind — translations (`translate()`)
don't have this problem and compose safely across nested elements.

## What's included in this part

- Landing page: gallery-wall hero, a real 3-step process section, a 7-style
  gallery, occasions grid, price list, testimonials, final CTA
- Auth: Login / Register, JWT stored client-side, `AuthProvider` context
- Dashboard: memory grid with an empty state
- New Memory: upload form (description required; photos, voice note, dates,
  location optional)
- Memory Detail: run AI analysis (mood/story/titles/tags + color palette swatches),
  pick a style to generate artwork, see all generated pieces for that memory
- Timeline: chronological narrative across all dated memories
- ESLint (flat config, React + React Hooks rules) wired up as `npm run lint`

**Part 4 — storefront:**
- `GiftPreview` component: stylized (deliberately illustrated, not fake-photorealistic)
  mockups for each product type — framed/canvas, mug, cushion, photo book, and a
  "digital download" browser-window mockup — matching the app's existing editorial voice
  rather than faking product photography
- Product Preview page: pick a product type/size for a generated artwork, see the
  live gift preview, add to cart
- Cart: quantities, contact phone + delivery address (required for every
  order, digital included — SSLCommerz needs it), real SSLCommerz Checkout
  redirect (cards, bKash, Nagad, Rocket, internet banking)
- Orders: order history with status
- Checkout success/cancel pages — cancel releases items back to the cart rather
  than leaving them stranded in limbo

**Part 5 — extras:**
- Memory Capsule: seal a memory to reopen on a future date. When sealed,
  `MemoryDetail` renders a dedicated capsule view (no content leaks) instead
  of the normal page; `Dashboard` shows a "Memory Capsule — opens…" card
  instead of trying to preview hidden content
- Collaborative memories: generate/copy an invite link from `MemoryDetail`;
  the public `Contribute` page (no login) lets anyone with the link add a
  photo or message; contributions show up back on `MemoryDetail`
- Voice transcription: a "Transcribe this voice note" button next to the
  audio player, backed by the AI service's real Grok STT integration
- Memory Constellation: a new page - the same dated-memory data as Timeline,
  laid out as an organic radial "star map" (phyllotaxis spiral) instead of a
  list, with hover tooltips

## Verified

- `npm run build` succeeds cleanly (Vite + Tailwind v4 plugin)
- `npm run lint` is clean throughout. Along the way it caught real issues each
  time: a fetch-on-mount pattern in `MemoryDetail` that I reviewed and kept
  (setState fires after the network round-trip, not synchronously in the
  effect — the correct pattern), a stray straight apostrophe, an unused
  variable in `Cart`, and — in `CheckoutCancel` — a genuinely synchronous
  `setState` inside an effect, which I fixed properly by computing the
  initial state with a lazy `useState` initializer instead of inside the
  effect, rather than just suppressing the warning.
- Caught and fixed a real bug during review: JSX text and JSX attribute
  strings don't interpret `\u2019`-style escape sequences the way JS string
  literals do. Several curly quotes/ellipses were written that way and would
  have rendered literal backslashes on screen. Fixed by using the actual typed
  Unicode characters everywhere, which works correctly in every context. Caught
  myself about to repeat the same mistake in a Part 4 file and fixed it
  immediately.
- I don't have a way to visually screenshot the app from this environment —
  build success + a clean lint pass + manual review is the verification this
  got. Worth an eyeball pass once you run it locally.
- Worth flagging plainly: the `\u2019`-in-JSX-text mistake described above
  recurred four more times while building Part 5 (including once in this
  README, where it's not even a JSX issue — just a stray literal backslash
  typed out of habit). Each instance was caught via a full source sweep
  before shipping, and Part 5's lint/build both came back clean, but the
  recurrence rate means it's worth your own skim too, not just my say-so.
- Prices switched from USD to BDT (৳), and Stripe was replaced with
  SSLCommerz (see the backend README for why — Stripe doesn't support
  Bangladesh-registered merchants). The same escape-sequence mistake nearly
  happened again writing the ৳ symbol into JSX text; I verified it in Node
  before trusting it this time rather than assuming.

## A dependency note

`npm audit` currently flags `react-router-dom` — as of this writing, every
published 7.x version has at least one open advisory, almost all of them
specific to SSR/RSC/"framework mode" (React Router used as a Remix-style
server framework: single-fetch loaders, Server Actions, prerendering, RSC
mode). This app only uses plain client-side `<BrowserRouter>`/`<Routes>` —
none of those features — so the practical exposure is low, but it's worth
re-running `npm audit` periodically and bumping the version once a clean
7.x (or 8.x) release ships.

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # point VITE_API_URL at your backend
npm run dev             # http://localhost:5173
```

Requires the backend (Part 1) running, which in turn calls the AI service
(Part 2) for analysis/artwork generation, and SSLCommerz sandbox keys in the
backend's `.env` for checkout to complete (see `../backend/README.md`).
`VITE_GOOGLE_CLIENT_ID` is optional — leave it blank and the Google sign-in
button on Login/Register just doesn't render, rather than breaking the page.
Without the backend running, the landing page and auth pages still work, but
the dashboard/upload/analysis/checkout flow won't.

## Status

The platform as originally scoped, every "stretch" feature from the spec,
and a full quality/enrichment pass are all built: memory upload, AI
analysis, artwork generation, timeline/constellation views, cart, checkout,
memory capsules, collaborative contributions, voice transcription,
forgot/reset password, Google sign-in, an admin dashboard, in-app
notifications, favorites, discount codes, gift messages, artwork
regenerate/variations, and search & filter.

**The enrichment pass, in detail:**

- Forgot/reset password (`ForgotPassword.jsx`, `ResetPassword.jsx`),
  Google sign-in (`GoogleAuthButton.jsx`)
- Admin dashboard (`AdminDashboard`, `AdminOrders`, `AdminUsers`,
  `AdminDiscountCodes`, `AdminContributions`) + discount codes and gift
  messages in `Cart.jsx`
- In-app notifications (`NotificationBell`, 30s polling), Favorites page
  and the favorite-toggle heart button on `MemoryDetail`'s artwork gallery
  (the backend toggle existed since Part 2 but had no UI until now)
- Regenerate/variations (`ArtworkVariationCard` groups a piece's history
  into one card with a prev/next carousel and a "try another take" button)
  and search & filter on the Dashboard (debounced keyword search + mood
  filter chips)

A genuinely synchronous `setState` in an effect turned up in the search/
filter work (`Dashboard.jsx`) - unlike the fetch-on-mount pattern elsewhere
in this app, where the setState calls happen inside a promise continuation,
`setLoading(true)` here fires synchronously as the effect starts, which is
what the flagged rule targets. Kept the pattern (it's the standard
search-as-you-type + loading-indicator approach, and there's no derived
value it could come from instead) and documented why in a comment next to
the disable, rather than either suppressing it silently or restructuring
away from a well-established pattern.
