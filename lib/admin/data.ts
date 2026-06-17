import "server-only";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Gate: only admins proceed. Returns a service-role client for cross-user reads. */
export async function requireAdmin(): Promise<{ userId: string; admin: SupabaseClient }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");
  return { userId: user.id, admin: createAdminClient() };
}

export interface AdminStats {
  users: number;
  verified: number;
  pending: number;
  paying: number;
}

export async function adminStats(admin: SupabaseClient): Promise<AdminStats> {
  const head = { count: "exact" as const, head: true };
  const [u, v, p, s] = await Promise.all([
    admin.from("profiles").select("*", head),
    admin.from("profiles").select("*", head).eq("verify_status", "verified"),
    admin.from("student_verifications").select("*", head).eq("status", "pending"),
    admin.from("subscriptions").select("*", head).in("status", ["active", "trialing"]),
  ]);
  return { users: u.count ?? 0, verified: v.count ?? 0, pending: p.count ?? 0, paying: s.count ?? 0 };
}

export interface AdminUser {
  id: string;
  full_name: string | null;
  school: string | null;
  plan: string;
  role: string;
  verify_status: string;
  suspended: boolean;
  created_at: string;
}

export async function listUsers(admin: SupabaseClient, limit = 50): Promise<AdminUser[]> {
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, school, plan, role, verify_status, suspended, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as AdminUser[]) ?? [];
}

export interface PendingVerification {
  id: string;
  user_id: string;
  method: string;
  evidence_url: string | null;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

export async function listPendingVerifications(admin: SupabaseClient): Promise<PendingVerification[]> {
  const { data } = await admin
    .from("student_verifications")
    .select("id, user_id, method, evidence_url, created_at, profiles(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  return (data as unknown as PendingVerification[]) ?? [];
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rollout: number;
  description: string | null;
}
export async function listFlags(admin: SupabaseClient): Promise<FeatureFlag[]> {
  const { data } = await admin.from("feature_flags").select("*").order("key");
  return (data as FeatureFlag[]) ?? [];
}
