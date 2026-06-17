"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/entitlements";
import { getWeekItems, getTargets } from "@/lib/data/queries";
import { hoursByPillar, balanceScore } from "@/lib/balance";
import { PILLARS } from "@/lib/constants/pillars";

/**
 * Pro-only: generate a personalized study plan with Claude from the user's
 * real week. Gated server-side by entitlement; no-ops gracefully if the API
 * key is unset.
 */
export async function generateStudyPlan(): Promise<{ ok: boolean; plan?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  const plan = await getUserPlan(supabase, user.id);
  if (plan !== "pro") return { ok: false, error: "Le coach IA est réservé au plan Pro." };

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, error: "IA non configurée (ANTHROPIC_API_KEY manquante)." };

  const [week, targets] = await Promise.all([getWeekItems(), getTargets()]);
  const actual = hoursByPillar(week);
  const score = balanceScore(week, targets);
  const summary = PILLARS.map((p) => `${p.label}: ${actual[p.id].toFixed(1)}h / cible ${targets[p.id]}h`).join("; ");
  const tasks = week
    .filter((i) => !i.done)
    .slice(0, 40)
    .map((i) => `${i.date} — ${i.title} (${i.pillar}, ${i.duration_min}min${i.type === "exam" ? ", EXAMEN" : ""})`)
    .join("\n");

  const body = {
    model: process.env.ANTHROPIC_MODEL || "claude-opus-4-8",
    max_tokens: 800,
    system:
      "Tu es le coach académique de BalanceU : bienveillant, concret, jamais culpabilisant. Réponds en français, en markdown court. Propose un plan réaliste pour le reste de la semaine qui : répartit les révisions avant les examens (pas de bachotage), protège le sommeil et un temps social, et rééquilibre les domaines négligés. Des actions datées, pas de blabla.",
    messages: [
      {
        role: "user",
        content: `Équilibre actuel : ${score}/100.\nHeures par domaine : ${summary}.\nTâches non terminées :\n${tasks || "(aucune)"}\n\nDonne-moi un plan d'étude équilibré pour le reste de la semaine.`,
      },
    ],
  };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, error: `Erreur IA (${res.status}).` };
    const json = (await res.json()) as { content?: { text?: string }[] };
    return { ok: true, plan: json.content?.[0]?.text ?? "" };
  } catch {
    return { ok: false, error: "L'IA est momentanément indisponible." };
  }
}
