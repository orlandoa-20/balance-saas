import "server-only";
import Stripe from "stripe";

// API version is left to the SDK/account default (avoids pinning to a literal
// that drifts across SDK upgrades). Secret key from env (test keys in dev).
// Placeholder fallback keeps module construction from throwing when the key is
// unset (e.g. during build); real API calls only run at request time.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_unset", {
  appInfo: { name: "BalanceU", version: "0.1.0" },
});
