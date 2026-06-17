import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface PriceRow {
  id: string;
  product_id: string;
  unit_amount: number | null;
  currency: string;
  interval: "month" | "year" | null;
  active: boolean;
  products?: { name: string | null } | null;
}

export interface SubscriptionRow {
  id: string;
  status: string;
  cancel_at_period_end: boolean | null;
  current_period_end: string;
  prices?: { id: string; products?: { name: string | null } | null } | null;
}

export async function getActivePrices(): Promise<PriceRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prices")
    .select("*, products(name, active)")
    .eq("active", true)
    .order("unit_amount", { ascending: true });
  return (data as PriceRow[]) ?? [];
}

export async function getSubscription(): Promise<SubscriptionRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("subscriptions")
    .select("*, prices(id, products(name))")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing", "past_due"])
    .maybeSingle();
  return (data as SubscriptionRow) ?? null;
}
