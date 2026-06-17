/**
 * Tier → Stripe product mapping (provided by the project owner).
 *
 * NOTE: these are PRODUCT ids (`prod_`). Stripe Checkout uses PRICE ids
 * (`price_`). The webhook (P5) syncs products + their prices into the
 * `products`/`prices` tables, and the pricing UI reads prices from the DB.
 * Use `priceForTier()` against the synced `prices` table at runtime; this map
 * is the source of truth for which product backs each tier/interval.
 *
 * These appear to be LIVE-mode products. For local development with test
 * keys, the corresponding test-mode product/price ids differ — but because we
 * read from the DB after webhook sync, no code change is needed per mode.
 */
export type Tier = "plus" | "pro";
export type Interval = "month" | "year";

export const STRIPE_PRODUCTS: Record<Tier, Record<Interval, string>> = {
  plus: {
    month: "prod_UiSry5EVaLfqIv", // BalanceU Plus
    year: "prod_UiSvPJAurbVfGn", // BalanceU Plus Annuel
  },
  pro: {
    month: "prod_UiSqCWAHQxq3GL", // BalanceU Pro
    year: "prod_UiStJZj1jUcTRP", // BalanceU Pro Annuel
  },
};

/** All product ids, for filtering the synced products table. */
export const ALL_PRODUCT_IDS = Object.values(STRIPE_PRODUCTS).flatMap((r) => Object.values(r));

export function productForTier(tier: Tier, interval: Interval): string {
  return STRIPE_PRODUCTS[tier][interval];
}
