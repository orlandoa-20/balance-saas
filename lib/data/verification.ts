"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Auto-approve via whitelisted university email domain, else require upload. */
export async function requestEmailVerification(): Promise<{
  ok: boolean;
  verified?: boolean;
  needsUpload?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  const email = (user.email ?? "").toLowerCase();
  const domain = email.split("@")[1] ?? "";
  if (!domain) return { ok: false, error: "Email invalide." };

  const { data: domains } = await supabase.from("university_domains").select("domain, auto_approve");
  const match = (domains ?? []).find(
    (d: { domain: string; auto_approve: boolean }) => domain === d.domain || domain.endsWith("." + d.domain)
  );

  if (match?.auto_approve) {
    await supabase.from("profiles").update({ verify_status: "verified" }).eq("id", user.id);
    await supabase.from("student_verifications").insert({
      user_id: user.id,
      method: "email_domain",
      status: "verified",
      reviewed_at: new Date().toISOString(),
    });
    revalidatePath("/verify");
    revalidatePath("/settings");
    return { ok: true, verified: true };
  }
  return { ok: true, verified: false, needsUpload: true };
}

/** Record an uploaded student-ID for manual admin review. */
export async function submitIdUpload(path: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };
  if (!path) return { ok: false, error: "Aucun fichier fourni." };

  const { error } = await supabase.from("student_verifications").insert({
    user_id: user.id,
    method: "id_upload",
    evidence_url: path,
    status: "pending",
  });
  if (error) return { ok: false, error: error.message };

  await supabase.from("profiles").update({ verify_status: "pending" }).eq("id", user.id);
  revalidatePath("/verify");
  revalidatePath("/settings");
  return { ok: true };
}
