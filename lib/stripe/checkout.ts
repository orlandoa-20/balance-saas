"use server";

import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Normalize: ensure a scheme (Stripe rejects scheme-less URLs) + no trailing slash.
const SITE = () => {
  let s = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim();
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  return s.replace(/\/+$/, "");
};

async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  const admin = createAdminClient();
  const { data: existing } = await admin.from("customers").select("stripe_customer_id").eq("id", userId).single();
  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const customer = await stripe.customers.create({ email, metadata: { supabase_uid: userId } });
  await admin.from("customers").upsert({ id: userId, stripe_customer_id: customer.id });
  return customer.id;
}

/** Start a Checkout Session for a price and redirect the user to Stripe. */
export async function checkout(priceId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let url: string | null = null;
  let errMsg: string | null = null;
  try {
    const customer = await getOrCreateCustomer(user.id, user.email ?? "");
    const session = await stripe.checkout.sessions.create({
      customer,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${SITE()}/settings?checkout=success`,
      cancel_url: `${SITE()}/settings?checkout=cancel`,
      subscription_data: { metadata: { supabase_uid: user.id } },
    });
    url = session.url;
  } catch (e) {
    errMsg = e instanceof Error ? e.message : "Erreur Stripe inconnue.";
    console.error("Stripe checkout error:", errMsg);
  }
  // redirect() must be OUTSIDE try (it throws a control-flow signal)
  if (url) redirect(url);
  redirect(`/settings?checkout_error=${encodeURIComponent((errMsg ?? "Aucune URL de session").slice(0, 180))}`);
}

/** Open the Stripe Billing Portal (cancel / upgrade / downgrade / invoices). */
export async function billingPortal(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data } = await admin.from("customers").select("stripe_customer_id").eq("id", user.id).single();
  if (!data?.stripe_customer_id) redirect("/settings?portal=nocustomer");

  const portal = await stripe.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${SITE()}/settings`,
  });
  redirect(portal.url);
}
