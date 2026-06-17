"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin/data";

async function audit(admin: SupabaseClient, actor: string, action: string, target: string, meta?: unknown) {
  await admin.from("audit_log").insert({ actor, action, target, meta: meta ?? null });
}

export async function adminSetVerify(userId: string, status: "verified" | "rejected") {
  const { userId: actor, admin } = await requireAdmin();
  await admin.from("profiles").update({ verify_status: status }).eq("id", userId);
  await admin
    .from("student_verifications")
    .update({ status, reviewed_by: actor, reviewed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "pending");
  await audit(admin, actor, `verify:${status}`, userId);
  revalidatePath("/admin");
}

export async function adminToggleSuspend(userId: string, suspended: boolean) {
  const { userId: actor, admin } = await requireAdmin();
  await admin.from("profiles").update({ suspended }).eq("id", userId);
  await audit(admin, actor, suspended ? "suspend" : "unsuspend", userId);
  revalidatePath("/admin");
}

export async function adminSetPlan(userId: string, plan: "free" | "plus" | "pro") {
  const { userId: actor, admin } = await requireAdmin();
  await admin.from("profiles").update({ plan }).eq("id", userId);
  await audit(admin, actor, `plan:${plan}`, userId);
  revalidatePath("/admin");
}

export async function adminToggleFlag(key: string, enabled: boolean) {
  const { userId: actor, admin } = await requireAdmin();
  await admin.from("feature_flags").update({ enabled }).eq("key", key);
  await audit(admin, actor, `flag:${key}:${enabled}`, key);
  revalidatePath("/admin");
}
