import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { weekDays, toKey } from "@/lib/date";
import type { PlanTier } from "@/lib/types";

export type AnalyticsLevel = "basic" | "full" | "forecast";

export interface Limits {
  itemsPerWeek: number | null; // null = unlimited
  goals: number | null;
  aiCoach: boolean;
  analytics: AnalyticsLevel;
  calendarSync: boolean;
}

/** Single source of truth for what each tier unlocks (server-enforced). */
export const LIMITS: Record<PlanTier, Limits> = {
  free: { itemsPerWeek: 15, goals: 3, aiCoach: false, analytics: "basic", calendarSync: false },
  plus: { itemsPerWeek: null, goals: null, aiCoach: false, analytics: "full", calendarSync: true },
  pro: { itemsPerWeek: null, goals: null, aiCoach: true, analytics: "forecast", calendarSync: true },
};

export async function getUserPlan(supabase: SupabaseClient, userId: string): Promise<PlanTier> {
  const { data } = await supabase.from("profiles").select("plan").eq("id", userId).single();
  return ((data?.plan as PlanTier) ?? "free");
}

export async function canCreateItem(
  supabase: SupabaseClient,
  userId: string
): Promise<{ ok: boolean; reason?: string }> {
  const plan = await getUserPlan(supabase, userId);
  const cap = LIMITS[plan].itemsPerWeek;
  if (cap == null) return { ok: true };

  const days = weekDays();
  const { count } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("date", toKey(days[0]))
    .lte("date", toKey(days[6]));

  if ((count ?? 0) >= cap) {
    return {
      ok: false,
      reason: `Limite du plan Free atteinte (${cap} blocs/semaine). Passe à Plus pour un nombre illimité.`,
    };
  }
  return { ok: true };
}
