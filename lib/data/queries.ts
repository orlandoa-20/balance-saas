import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PILLARS, type PillarId } from "@/lib/constants/pillars";
import type { Item, Course, PillarTargets, Profile } from "@/lib/types";
import { weekDays, toKey, todayKey, today, addDays } from "@/lib/date";
import { ITEM_TYPES } from "@/lib/constants/pillars";

export function defaultTargets(): PillarTargets {
  return Object.fromEntries(PILLARS.map((p) => [p.id, p.target])) as PillarTargets;
}

async function ctx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getProfile(): Promise<Profile | null> {
  const { supabase, user } = await ctx();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
}

export async function getTargets(): Promise<PillarTargets> {
  const { supabase, user } = await ctx();
  if (!user) return defaultTargets();
  const { data } = await supabase.from("pillar_targets").select("*").eq("user_id", user.id).single();
  if (!data) return defaultTargets();
  const t = data as Record<PillarId, number>;
  return Object.fromEntries(PILLARS.map((p) => [p.id, t[p.id] ?? p.target])) as PillarTargets;
}

export async function getWeekItems(ref?: Date): Promise<Item[]> {
  const { supabase, user } = await ctx();
  if (!user) return [];
  const days = weekDays(ref);
  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", toKey(days[0]))
    .lte("date", toKey(days[6]))
    .order("start_time", { ascending: true, nullsFirst: false });
  return (data as Item[]) ?? [];
}

export async function getItemsOn(dateKey: string): Promise<Item[]> {
  const { supabase, user } = await ctx();
  if (!user) return [];
  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", dateKey)
    .order("start_time", { ascending: true, nullsFirst: false });
  return (data as Item[]) ?? [];
}

export async function getCourses(): Promise<Course[]> {
  const { supabase, user } = await ctx();
  if (!user) return [];
  const { data } = await supabase.from("courses").select("*").eq("user_id", user.id).order("name");
  return (data as Course[]) ?? [];
}

export async function getUpcoming(limit = 5): Promise<Item[]> {
  const { supabase, user } = await ctx();
  if (!user) return [];
  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .in("type", ["exam", "task", "study"])
    .eq("done", false)
    .gte("date", todayKey())
    .order("date", { ascending: true })
    .limit(limit);
  return (data as Item[]) ?? [];
}

/** Consecutive days up to today with ≥1 completed completable item. */
export async function getStreak(): Promise<number> {
  const { supabase, user } = await ctx();
  if (!user) return 0;
  const since = toKey(addDays(today(), -60));
  const { data } = await supabase
    .from("items")
    .select("date,type,done")
    .eq("user_id", user.id)
    .eq("done", true)
    .gte("date", since);
  if (!data) return 0;

  const completable = new Set(Object.entries(ITEM_TYPES).filter(([, v]) => v.completable).map(([k]) => k));
  const days = new Set<string>();
  for (const it of data as { date: string; type: string }[]) {
    if (completable.has(it.type)) days.add(it.date);
  }
  let n = 0;
  for (let i = 0; i < 60; i++) {
    const k = toKey(addDays(today(), -i));
    if (days.has(k)) n++;
    else if (i > 0) break;
  }
  return n;
}
