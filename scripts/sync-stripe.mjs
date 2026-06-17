// One-off: copy active Stripe products + prices into Supabase (products/prices
// tables) so the pricing UI shows offers. Env:
//   STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const okInterval = (i) => (i === "month" || i === "year" ? i : null);

const products = await stripe.products.list({ active: true, limit: 100 });
for (const p of products.data) {
  const { error } = await db.from("products").upsert({
    id: p.id, active: p.active, name: p.name,
    description: p.description ?? null, image: p.images?.[0] ?? null, metadata: p.metadata,
  });
  console.log(`product ${p.id} ${p.name}${error ? " ✗ " + error.message : " ✓"}`);
}

const prices = await stripe.prices.list({ active: true, limit: 100, expand: ["data.product"] });
for (const pr of prices.data) {
  if (!pr.recurring) { console.log(`price ${pr.id} (one-time, skipped)`); continue; }
  const { error } = await db.from("prices").upsert({
    id: pr.id,
    product_id: typeof pr.product === "string" ? pr.product : pr.product.id,
    active: pr.active, currency: pr.currency, unit_amount: pr.unit_amount,
    interval: okInterval(pr.recurring?.interval), interval_count: pr.recurring?.interval_count ?? null,
    trial_period_days: pr.recurring?.trial_period_days ?? null, metadata: pr.metadata,
  });
  console.log(`price ${pr.id} ${(pr.unit_amount ?? 0) / 100}${pr.currency} /${pr.recurring?.interval}${error ? " ✗ " + error.message : " ✓"}`);
}

const { data } = await db.from("prices").select("id, unit_amount, currency, interval, product_id").eq("active", true);
console.log(`\nactive prices now in DB: ${data?.length ?? 0}`);
