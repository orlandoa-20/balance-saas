# BalanceU — Setup & Deployment

Production stack: **Next.js 16 (Vercel)** · **Supabase** (Postgres + Auth + Storage) ·
**Stripe** (billing) · **Resend** (email) · optional **Anthropic** (Pro AI) + **Sentry**.

> The app runs locally with no backend (marketing + auth UI render; protected
> routes redirect to `/login`). Add the keys below to make it fully functional.

## 1. Local run

```bash
npm install
cp .env.example .env.local      # fill in values (see below)
npm run dev                     # http://localhost:3000
npm run typecheck && npm test   # verify
```

## 2. Supabase

1. Create a project at supabase.com → copy **Project URL**, **anon key**, **service_role key** into `.env.local`.
2. Apply the schema (SQL editor or CLI):
   ```bash
   # via CLI
   supabase link --project-ref <ref>
   supabase db push        # runs supabase/migrations/*.sql
   # …or paste 0001_init.sql then 0002_storage.sql into the SQL editor
   ```
3. **Auth providers**: Authentication → Providers → enable **Google** and **Apple**
   (add client IDs/secrets). Set the redirect URL to `${SITE}/auth/callback`.
4. **Email**: Supabase sends verification + reset emails by default. To brand them
   through Resend, set Resend as the **custom SMTP** provider (Auth → SMTP).
5. The `student-ids` Storage bucket + RLS are created by `0002_storage.sql`.
6. To grant yourself admin: `update profiles set role='admin' where id='<your-uid>';`

## 3. Stripe

1. Create the four products (already mapped in `lib/stripe/products.ts`):
   BalanceU Plus / Plus Annuel / Pro / Pro Annuel — each with a recurring **price**.
2. Copy `sk_…` (secret) and `pk_…` (publishable) into `.env.local`. **Use test keys in dev.**
3. Webhook: `stripe listen --forward-to localhost:3000/api/webhooks` (dev) — copy the
   `whsec_…` into `STRIPE_WEBHOOK_SECRET`. In prod, add an endpoint at
   `${SITE}/api/webhooks` for events: `product.*`, `price.*`, `checkout.session.completed`,
   `customer.subscription.*`. The webhook syncs products/prices/subscriptions to the DB and
   reconciles `profiles.plan`.
4. Test checkout with card `4242 4242 4242 4242`.

## 4. Resend (email)

Add `RESEND_API_KEY` and `RESEND_FROM` (a verified domain). Welcome + subscription emails
send automatically; without the key they no-op (logged, never blocking).

## 5. Pro AI (optional)

`ANTHROPIC_API_KEY` enables the Pro study-plan generator (`lib/coach-ai.ts`, latest Claude
model via `ANTHROPIC_MODEL`). Gated to Pro server-side.

## 6. Deploy to Vercel

1. Import the repo in Vercel.
2. Add all env vars from `.env.example` (Production + Preview). Set `NEXT_PUBLIC_SITE_URL`
   to the deployed URL.
3. Deploy. Add the Stripe webhook endpoint pointing at the prod URL.
4. Update Supabase Auth redirect URLs + OAuth providers with the prod domain.

## 7. CI / monitoring

- `.github/workflows/ci.yml`: typecheck → lint → unit tests → build, plus a Playwright e2e job.
- **Sentry** (optional): `npm i @sentry/nextjs && npx @sentry/wizard@latest -i nextjs`, set `SENTRY_DSN`.

## Security checklist (implemented)

- RLS on every user table (`auth.uid() = user_id`); private `customers`; admin via `is_admin()`.
- Stripe webhook signature verification (`constructEvent`).
- Zod validation on every server action; React auto-escaping (no `dangerouslySetInnerHTML` on user data).
- Security headers + CSP in `next.config.ts`; rate limiting (`lib/rate-limit.ts`).
- Secrets server-only; only `NEXT_PUBLIC_*` reach the client.
- **To harden before scale**: replace CSP `'unsafe-inline'` script-src with per-request nonces;
  swap the in-memory limiter for Upstash Redis.
