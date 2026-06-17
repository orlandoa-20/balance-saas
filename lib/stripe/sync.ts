import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/config";
import { STRIPE_PRODUCTS, type Tier } from "@/lib/stripe/products";
import type { PlanTier } from "@/lib/types";

const toISO = (s: number | null | undefined) => (s ? new Date(s * 1000).toISOString() : null);

export async function upsertProductRecord(product: Stripe.Product) {
  const admin = createAdminClient();
  await admin.from("products").upsert({
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  });
}

export async function upsertPriceRecord(price: Stripe.Price) {
  const admin = createAdminClient();
  await admin.from("prices").upsert({
    id: price.id,
    product_id: typeof price.product === "string" ? price.product : price.product.id,
    active: price.active,
    currency: price.currency,
    unit_amount: price.unit_amount,
    interval: price.recurring?.interval ?? null,
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata,
  });
}

export async function deleteProductRecord(product: Stripe.Product) {
  await createAdminClient().from("products").delete().eq("id", product.id);
}
export async function deletePriceRecord(price: Stripe.Price) {
  await createAdminClient().from("prices").delete().eq("id", price.id);
}

export async function upsertCustomer(userId: string, customerId: string) {
  await createAdminClient().from("customers").upsert({ id: userId, stripe_customer_id: customerId });
}

function tierForProduct(productId?: string | null): PlanTier {
  if (!productId) return "free";
  for (const [tier, intervals] of Object.entries(STRIPE_PRODUCTS) as [Tier, Record<string, string>][]) {
    if (Object.values(intervals).includes(productId)) return tier;
  }
  return "free";
}

async function userIdForCustomer(customerId: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();
  return data?.id ?? null;
}

/** Sync a Stripe subscription into the DB and reconcile the user's plan tier. */
export async function manageSubscriptionStatusChange(subscriptionId: string, customerId: string) {
  const admin = createAdminClient();
  const userId = await userIdForCustomer(customerId);
  if (!userId) return;

  const sub = (await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product"],
  })) as unknown as Stripe.Subscription & {
    current_period_start: number;
    current_period_end: number;
  };

  const item = sub.items.data[0];
  const price = item?.price;
  const productId = price ? (typeof price.product === "string" ? price.product : price.product.id) : null;

  await admin.from("subscriptions").upsert({
    id: sub.id,
    user_id: userId,
    status: sub.status,
    price_id: price?.id ?? null,
    quantity: item?.quantity ?? 1,
    cancel_at_period_end: sub.cancel_at_period_end,
    current_period_start: toISO(sub.current_period_start),
    current_period_end: toISO(sub.current_period_end),
    cancel_at: toISO(sub.cancel_at),
    canceled_at: toISO(sub.canceled_at),
    ended_at: toISO(sub.ended_at),
    trial_start: toISO(sub.trial_start),
    trial_end: toISO(sub.trial_end),
    metadata: sub.metadata,
  });

  const active = sub.status === "active" || sub.status === "trialing";
  const plan: PlanTier = active ? tierForProduct(productId) : "free";
  await admin.from("profiles").update({ plan }).eq("id", userId);
}
