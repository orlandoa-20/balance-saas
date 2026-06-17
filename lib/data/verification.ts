"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Auto-approve via whitelisted university email domain, else require upload.
 * SECURITY: the user's identity + email come from the trusted authenticated
 * session (getUser), the domain is re-checked server-side, and the privileged
 * `verify_status` write goes through the SERVICE ROLE — users cannot set it
 * themselves (column UPDATE is revoked from `authenticated`, see migration 0003).
 */
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

  // must actually own the email (confirmed) before any domain auto-approval
  if (!user.email_confirmed_at) {
    return { ok: false, error: "Confirme d'abord ton adresse email (lien reçu par mail)." };
  }

  const email = (user.email ?? "").toLowerCase();
  const domain = email.split("@")[1] ?? "";
  if (!domain) return { ok: false, error: "Email invalide." };

  const admin = createAdminClient();
  const { data: domains } = await admin.from("university_domains").select("domain, auto_approve");
  const match = (domains ?? []).find(
    (d: { domain: string; auto_approve: boolean }) => domain === d.domain || domain.endsWith("." + d.domain)
  );

  if (match?.auto_approve) {
    await admin.from("profiles").update({ verify_status: "verified" }).eq("id", user.id);
    await admin.from("student_verifications").insert({
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

/**
 * Record an uploaded student-ID for manual admin review. The file itself is
 * uploaded client-side into a PRIVATE bucket (owner-only RLS); here we record
 * the pending request and set status='pending' via the service role.
 */
export async function submitIdUpload(path: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };
  if (!path) return { ok: false, error: "Aucun fichier fourni." };

  const admin = createAdminClient();
  const { error } = await admin.from("student_verifications").insert({
    user_id: user.id,
    method: "id_upload",
    evidence_url: path,
    status: "pending",
  });
  if (error) return { ok: false, error: error.message };

  await admin.from("profiles").update({ verify_status: "pending" }).eq("id", user.id);
  revalidatePath("/verify");
  revalidatePath("/settings");
  return { ok: true };
}
