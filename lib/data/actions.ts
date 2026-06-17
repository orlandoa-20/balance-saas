"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PILLAR_IDS } from "@/lib/constants/pillars";
import { canCreateItem } from "@/lib/entitlements";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");
  return { supabase, user };
}

const itemSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(200),
  pillar: z.enum(PILLAR_IDS),
  type: z.enum(["class", "study", "exam", "task", "work", "event"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  duration_min: z.coerce.number().int().min(5).max(1440),
  rrule: z.string().nullable().optional(),
});
export type ItemInput = z.input<typeof itemSchema>;

export async function addItem(input: ItemInput): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await requireUser();
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Entrée invalide" };

  // entitlement check: weekly item cap on free tier
  const allowed = await canCreateItem(supabase, user.id);
  if (!allowed.ok) return { ok: false, error: allowed.reason };

  const { error } = await supabase.from("items").insert({ ...parsed.data, user_id: user.id });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/planner");
  revalidatePath("/balance");
  return { ok: true };
}

export async function toggleItem(id: string, done: boolean): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase.from("items").update({ done }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath("/planner");
}

export async function deleteItem(id: string): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase.from("items").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath("/planner");
  revalidatePath("/balance");
}

export async function setTarget(pillar: (typeof PILLAR_IDS)[number], value: number): Promise<void> {
  const { supabase, user } = await requireUser();
  const v = Math.max(0, Math.min(60, Math.round(value)));
  await supabase.from("pillar_targets").update({ [pillar]: v }).eq("user_id", user.id);
  revalidatePath("/balance");
  revalidatePath("/dashboard");
}

const onboardingSchema = z.object({
  full_name: z.string().trim().min(1).max(80),
  school: z.string().trim().max(120).optional().default(""),
  priorities: z.array(z.enum(PILLAR_IDS)).max(7).default([]),
  goal: z.string().trim().max(60).optional().default(""),
});
export type OnboardingInput = z.input<typeof onboardingSchema>;

export async function completeOnboarding(input: OnboardingInput): Promise<void> {
  const { supabase, user } = await requireUser();
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) throw new Error("Données d'onboarding invalides.");
  const { full_name, school, priorities, goal } = parsed.data;

  await supabase
    .from("profiles")
    .update({ full_name, school, priorities, goal, onboarded: true })
    .eq("id", user.id);

  // bump targets for chosen priorities (+25%)
  if (priorities.length) {
    const { data: targets } = await supabase.from("pillar_targets").select("*").eq("user_id", user.id).single();
    if (targets) {
      const patch: Record<string, number> = {};
      for (const p of priorities) patch[p] = Math.round((targets[p] ?? 0) * 1.25);
      await supabase.from("pillar_targets").update(patch).eq("user_id", user.id);
    }
  }
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// ---- courses (GPA) ----
const courseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  credits: z.coerce.number().min(0).max(30),
  grade: z.string().trim().max(3).nullable().optional(),
});
export async function addCourse(input: z.input<typeof courseSchema>): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await requireUser();
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Cours invalide" };
  const { error } = await supabase.from("courses").insert({ ...parsed.data, user_id: user.id });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  return { ok: true };
}
export async function deleteCourse(id: string): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase.from("courses").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/courses");
  revalidatePath("/dashboard");
}
