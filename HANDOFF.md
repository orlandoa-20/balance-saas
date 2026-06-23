# BalanceU — Project Handoff / Status

_Last updated: session ending 2026-06. Read this first when continuing._

## What this is
**BalanceU** — a production student life-balance SaaS. Tracks time across **7 life
pillars** (academics, health, work, sports, relationships, finances, growth) with a
balance score, productivity score, streaks, planner, GPA, and an AI coach.

- **Live:** https://balanceu-saas.vercel.app
- **Repo:** https://github.com/orlandoa-20/balance-saas (Vercel is **Git-connected** → `git push origin main` auto-deploys)
- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres+Auth+Storage, RLS) · Stripe · Resend · Anthropic (Pro AI) · deployed on Vercel
- **Demo/admin account:** `admin@balanceu.app` / `BalanceU-demo-2026!` (role=admin)

## ⚠️ Next.js 16 gotchas (this is NOT Next 15)
- Middleware is **`proxy.ts`** (root), not middleware.ts
- `cookies()` / `headers()` / `searchParams` are **async** (await them)
- Supabase SSR uses **`getAll`/`setAll`** cookie API
- Tailwind v4 = CSS-first `@theme` in `app/globals.css` (no tailwind.config)
- Read `node_modules/next/dist/docs/` before using unfamiliar Next APIs

## Services & config
- **Supabase** ref `hzewqhiarbztxphuhtum`. Migrations applied to live DB: `supabase/migrations/0001_init.sql`, `0002_storage.sql`, `0003_harden_profiles.sql`.
- **Stripe** (LIVE mode): 4 products (Plus/Pro × monthly/annual), prices synced into DB. Mapping in `lib/stripe/products.ts`. Webhook at `/api/webhooks` (needs the 10 events; subscription sync confirmed working).
- **Env vars (exact names)** — set in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (opt), `RESEND_API_KEY`/`RESEND_FROM` (opt), `SENTRY_DSN` (opt). Full list in `.env.example`.

## ✅ Done & verified live
Auth (email + Google OAuth; Apple wired, not configured) · onboarding · dashboard
(scores/streak/deadlines/weekly chart/GPA) · planner (+weekly recurrence, any-date) ·
balance (rings/donut/targets) · courses+GPA · **smarter AI-aware coach** · student
verification · **admin panel** (+audit log) · **Stripe checkout → webhook → plan
activation** · emails (Resend) · security headers/CSP/rate-limit (webhook) · sitemap/
robots/JSON-LD · Vitest (13) + Playwright + CI. **Security audited: no secrets in the
client bundle.**

## 🔧 Outstanding — USER/account actions (no code)
1. **Anthropic credits**: AI coach returns "credit balance too low" → add credits at console.anthropic.com → Billing. (Code is correct.)
2. **Duplicate subscription**: admin account is active on BOTH Pro (9,99€) and Plus (4,99€) → cancel one via Settings → "Gérer" (billing portal).
3. **Rotate secrets shared during setup** (Supabase service key, DB password, any Stripe key pasted) and update Vercel.
4. Verify Stripe webhook endpoint has the 10 events (see README/DEPLOY).

## 🗺️ Feature backlog (requested, NOT yet built)
**Medium (recommended order):**
1. Subscription **feature-gating** (make Free/Plus/Pro actually differ in-app) + a "what you've unlocked" guide.
2. **Onboarding tutorial** (coach-marks) on first login + "how did you hear about us?" survey field.
3. **University search** (global university dataset) + **country-aware GPA/grading** systems (10 most-spoken-language countries).
4. **Timetable import** (.ics upload) + **calendar subscribe feed** (one-way .ics for Google/Apple/Outlook; full 2-way sync is much bigger).
5. **Admin analytics** (revenue, KPIs, engagement, marketing).
6. **i18n** — translate to 10 languages.
7. Webhook robustness: handle `invoice.payment_failed` / `invoice.paid` (downgrade on failed renewal, renewal emails).

**Large / different track (not a web codebase change):**
- Native **App Store / Play Store** apps + **home-screen widget** → needs Capacitor/React-Native wrapper + paid dev accounts. **Pragmatic middle ground: make it an installable PWA** (manifest + service worker).
- SEO "on all search engines" → submit to Google Search Console + Bing (manual, user action; sitemap/robots already present).

## 🛠️ Improvements / tech debt
- Landing page has no full **pricing/FAQ/testimonials** marketing section (offers only show in Settings).
- CSP uses `'unsafe-inline'` for scripts → move to per-request **nonces** before scale.
- Rate limiting only on the webhook → add to auth + mutations; swap in-memory limiter for **Upstash Redis**.
- No generated **OG image**; **Lighthouse** not measured; AddItem **modal lacks focus trap** (a11y).
- **Sentry/analytics** documented but not wired.
- Playwright e2e authored; runs only in CI (`npx playwright install` needed).

## 🧰 Dev workflow
- **Node:** `~/.local/node22/bin` (export to PATH). `npm run dev` / `build` / `lint` / `test`.
- **Deploy:** `git push origin main` → Vercel auto-builds. (Earlier the project was a "Vercel Drop"/not Git-connected — that's now fixed.)
- **Verify live (no preview server — sandbox can't reach ~/Downloads):** headless Chrome / Playwright against the live URL. Helper scripts in `scripts/`:
  - `migrate.mjs <file>` — apply a migration via pg pooler (needs `DATABASE_URL`)
  - `seed-admin.mjs` — create confirmed admin + seed a realistic week
  - `sync-stripe.mjs` — pull Stripe products/prices → DB (needs `STRIPE_SECRET_KEY`)
  - `shots.mjs` / `test-checkout.mjs` / `test-ai.mjs` / `check-grants.mjs` — live verification
  - DB connection (pooler): `postgresql://postgres.hzewqhiarbztxphuhtum:<DB_PASSWORD>@aws-1-us-east-1.pooler.supabase.com:5432/postgres` (direct `db.<ref>` host is IPv6-only / won't resolve)

## Key files
`app/(app)/*` pages · `app/(auth)/*` · `app/admin/*` · `app/api/webhooks/route.ts` ·
`proxy.ts` · `lib/supabase/{server,client,admin,proxy-session}.ts` ·
`lib/stripe/{config,sync,checkout,products}.ts` · `lib/data/{queries,actions,billing,verification}.ts` ·
`lib/{balance,coach,coach-ai,entitlements,date}.ts` · `lib/admin/{data,actions}.ts` ·
`components/app/*` · `ARCHITECTURE.md` (full design) · `DEPLOY.md` (setup).
