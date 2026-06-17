"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/entitlements";
import { getWeekItems, getTargets, getUpcoming } from "@/lib/data/queries";
import { hoursByPillar, balanceScore, productivityScore, weekCompletion } from "@/lib/balance";
import { PILLARS, ITEM_TYPES } from "@/lib/constants/pillars";
import { daysUntil, todayKey } from "@/lib/date";

/**
 * Pro-only: generate a personalized study plan with Claude from the user's
 * REAL week — completed, pending, upcoming deadlines and weekly objectives.
 * Gated server-side by entitlement; no-ops gracefully without the API key.
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

  const [week, targets, upcoming] = await Promise.all([getWeekItems(), getTargets(), getUpcoming(10)]);
  const actual = hoursByPillar(week);
  const score = balanceScore(week, targets);
  const prod = productivityScore(week, targets);
  const comp = weekCompletion(week);

  const done = week.filter((i) => i.done && ITEM_TYPES[i.type]?.completable).map((i) => i.title);
  const pending = week
    .filter((i) => !i.done && ITEM_TYPES[i.type]?.completable)
    .map((i) => `${i.date} — ${i.title} (${i.pillar}, ${i.duration_min}min)`);
  const deadlines = upcoming.map((i) => `${i.title} [${i.type}] ${i.date} — dans ${daysUntil(i.date)} j`);
  const objectives = PILLARS.map((p) => `${p.label} ${actual[p.id].toFixed(1)}/${targets[p.id]}h`);

  const content = [
    `Aujourd'hui : ${todayKey()}.`,
    `Scores — équilibre ${score}/100, productivité ${prod}/100, tâches cochées ${comp.done}/${comp.total}.`,
    `Objectifs hebdo (réel/cible) : ${objectives.join(" · ")}.`,
    `Déjà accompli cette semaine : ${done.join(", ") || "(rien encore)"}.`,
    `Tâches en attente cette semaine :\n${pending.join("\n") || "(aucune)"}.`,
    `Échéances à venir :\n${deadlines.join("\n") || "(aucune)"}.`,
    `\nDonne-moi un plan concret pour le reste de la semaine.`,
  ].join("\n");

  const body = {
    model: process.env.ANTHROPIC_MODEL || "claude-opus-4-8",
    max_tokens: 900,
    system:
      "Tu es le coach académique de BalanceU : bienveillant, concret, jamais culpabilisant. Réponds en français, en markdown court. " +
      "Tiens compte de ce qui est DÉJÀ accompli (ne le replanifie pas, félicite brièvement). Planifie les tâches EN ATTENTE et les ÉCHÉANCES à venir en répartissant la charge sur des créneaux datés (jour + heure indicative), sans bachotage. " +
      "Comble en priorité les objectifs hebdomadaires en retard, mais protège le sommeil et un temps social. Termine par une seule action immédiate pour aujourd'hui.",
    messages: [{ role: "user", content }],
  };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, error: `Erreur IA (${res.status}).` };
    const json = (await res.json()) as { content?: { text?: string }[] };
    return { ok: true, plan: json.content?.[0]?.text ?? "" };
  } catch {
    return { ok: false, error: "L'IA est momentanément indisponible." };
  }
}
