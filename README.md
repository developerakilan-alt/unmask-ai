# unmask-ai

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-rjxhghru)

AI image forensics — "Real or AI? Find out in seconds." Upload any image and
Unmask AI runs pixel-level forensics (noise, EXIF, compression and GAN
artifacts) to tell you if it is real or machine-made.

## Features

- **Quick Scan (on-device)** — heuristic detector that runs entirely in the
  browser; used automatically when the backend is unreachable so scans never
  hard-fail (`src/lib/localDetect.ts`).
- **Scan history** — results are saved to `localStorage` and mirrored to a
  Supabase `scan_history` table when signed in (`src/lib/history.ts`,
  `supabase/migration.sql`).
- **Video detection** — samples up to 8 frames client-side
  (`sampleVideoFrames`) and scans them on-device (`src/components/VideoAnalyzer.tsx`).
- **Side-by-side comparison** — compare two images at once
  (`src/components/ComparePanel.tsx`).
- **Source credibility checker** — paste a URL, fetch its main image via CORS
  proxies (allorigins / weserv) and analyse it (`src/components/SourceChecker.tsx`).
- **Pro billing** — Stripe checkout modal; requires `VITE_STRIPE_PAYMENT_LINK`
  in the build environment to go live (`src/lib/billing.ts`).
- **Browser extension** — MV3 extension in `browser-extension/` for right-click
  scanning on any page.
- **Batch import** — multi-select files, a whole folder, or a CSV/URL list
  (`src/components/BatchPanel.tsx`).
- **i18n** — English and Spanish (`src/lib/i18n.tsx`).

## CDN / caching

The app is deployed to GitHub Pages as a fully static bundle. Performance and
caching notes:

- Vite content-hashes all assets, so files are immutable — CDNs can cache them
  aggressively (`index.html` stays `no-cache`, assets are cached forever).
- The service worker (via `vite-plugin-pwa`, `registerSW`) caches the app shell
  for offline use and updates in the background on deploy.
- jsPDF is dynamically imported only when a report is downloaded; the analysis
  pages are route-level lazy-loaded so the landing page ships first.
- If you serve from your own CDN, point it at the `dist/` output and keep
  `/unmask-ai/` as the base path (see `vite.config.ts`).

## Backend

FastAPI backend in `backend/` (run `uvicorn main:app --port 8000`). Endpoints
include `/api/v1/analyze`, `/api/v1/analyze-batch`, `/api/v1/analyze-url`,
`/api/v1/analyze-video`, `/api/v1/face-check`, scan history, shares, webhooks,
API keys, reports and GDPR deletion.

## Env

Copy `.env` (local only, gitignored) and set:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_STRIPE_PAYMENT_LINK=<checkout link>   # optional, enables Pro checkout
```
