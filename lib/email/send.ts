import "server-only";

/**
 * Minimal Resend sender via fetch (no extra dependency). No-ops gracefully
 * when RESEND_API_KEY is unset so flows never break in dev.
 *
 * Note: Supabase Auth already sends verification + password-reset emails. To
 * brand those through Resend, set Resend as Supabase's custom SMTP provider
 * (project settings) — see ARCHITECTURE.md. The app-triggered emails below
 * (welcome, subscription) go through this sender directly.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "BalanceU <onboarding@resend.dev>";
  if (!key || !to) {
    if (!key) console.warn("[email] RESEND_API_KEY unset — skipping send to", to);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) console.error("[email] Resend error", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("[email] send failed", e);
    return false;
  }
}
