import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/config";
import {
  upsertProductRecord,
  upsertPriceRecord,
  deleteProductRecord,
  deletePriceRecord,
  manageSubscriptionStatusChange,
} from "@/lib/stripe/sync";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { subscriptionEmail } from "@/lib/email/templates";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const relevantEvents = new Set([
  "product.created",
  "product.updated",
  "product.deleted",
  "price.created",
  "price.updated",
  "price.deleted",
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export async function POST(req: Request) {
  if (!rateLimit(`webhook:${clientIp(req)}`, 120, 60_000)) {
    return new Response("Too Many Requests", { status: 429 });
  }
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    if (!sig || !secret) return new Response("Webhook signature/secret missing.", { status: 400 });
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  if (!relevantEvents.has(event.type)) {
    return Response.json({ received: true });
  }

  try {
    switch (event.type) {
      case "product.created":
      case "product.updated":
        await upsertProductRecord(event.data.object as Stripe.Product);
        break;
      case "product.deleted":
        await deleteProductRecord(event.data.object as Stripe.Product);
        break;
      case "price.created":
      case "price.updated":
        await upsertPriceRecord(event.data.object as Stripe.Price);
        break;
      case "price.deleted":
        await deletePriceRecord(event.data.object as Stripe.Price);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await manageSubscriptionStatusChange(sub.id, sub.customer as string);
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          await manageSubscriptionStatusChange(session.subscription as string, session.customer as string);

          // confirmation email
          const email = session.customer_details?.email;
          if (email) {
            const admin = createAdminClient();
            let tier = "Premium";
            let name = session.customer_details?.name ?? "toi";
            const { data: cust } = await admin
              .from("customers")
              .select("id")
              .eq("stripe_customer_id", session.customer as string)
              .single();
            if (cust?.id) {
              const { data: prof } = await admin.from("profiles").select("plan, full_name").eq("id", cust.id).single();
              if (prof) {
                tier = prof.plan === "pro" ? "Pro" : "Plus";
                name = prof.full_name ?? name;
              }
            }
            const { subject, html } = subscriptionEmail(name, tier);
            await sendEmail({ to: email, subject, html });
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return new Response("Webhook handler failed.", { status: 500 });
  }

  return Response.json({ received: true });
}
