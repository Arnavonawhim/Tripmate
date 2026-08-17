# Tripmate — web client

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui.

Two product surfaces in one app: the **consumer travel site** (home, destinations,
booking, assistant) and the **gateway console** (`/console`) — the operator view
onto the multi-model router.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
```

Backends are unchanged and run separately (see the repo root README):

| Service | Port | Used by |
| --- | --- | --- |
| `router/` | 8000 | `/chat`, `/console`, `/contact` |
| `vision-worker/` | 8001 | `/console` → Vision tab |

`.env.local`:

```
NEXT_PUBLIC_ROUTER_URL=http://localhost:8000
NEXT_PUBLIC_VISION_URL=http://localhost:8001
```

## Layout

```
app/
  layout.tsx              root shell — fonts, grain, providers
  (site)/                 route group sharing header + footer
    page.tsx              home
    destinations/         index + [slug] detail
    book/[slug]/          booking
    chat/                 travel assistant
    console/              gateway console
    about/  contact/
components/
  ui/                     shadcn primitives (owned source, brand-themed)
  layout/                 SiteHeader, SiteFooter
  motion/                 Reveal, Stagger, RevealLines, Parallax
  destinations/           card + search browser
  booking/  chat/  contact/
  console/                AskPanel, StreamPanel, ScenePanel, MetricsPanel
lib/
  api.ts                  router + vision client (contracts unchanged)
  places.ts               destination data (ported from legacy data.js)
  hooks/                  useChat, useRouterHealth
legacy/                   the previous static site, kept intact for reference
```

## Design tokens

Defined once in `app/globals.css`:

- **Brand teal** `--color-brand-700: #035352` — primary actions, links, active states
- **Sidecar** `--color-sand-200: #F3E8BC` — accent surfaces, price chips, dark-section type
- Sand/ink scales, `--font-display` (Fraunces) + `--font-sans` (Inter), easing curves

shadcn's token contract (`--primary`, `--background`, `--border`, …) is mapped onto
these, so every primitive inherits the brand. `.dark` flips the palette and is applied
per-section (console, footer) rather than globally.

All motion respects `prefers-reduced-motion`.

## State

- **TanStack Query** — server state (`/health`, `/models`, `/metrics/models`)
- **Local `useState`/`useReducer`** — forms, composer, tabs, chat transcript
- **react-hook-form + zod** — booking and contact validation

No global store; nothing here needs one.

## Notes on behaviour carried over

- Old URLs (`place.html?slug=…`, `book.html?slug=…`, etc.) redirect via `next.config.mjs`.
- Booking is local-only and sends no request, exactly as before.
- Contact posts the same `{prompt, strategy:"semantic"}` body to `/ask`.
- Chat's Stream and Telemetry modes now use the SSE reader and the GET metrics call.
  Previously both POSTed and always failed.
