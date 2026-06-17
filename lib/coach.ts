/**
 * Deterministic coach engine — pure, data-driven recommendations from the
 * user's real week. Never generic. (Ported from the static demo.)
 * The Pro tier layers an LLM study-plan on top (see app/(app)/coach).
 */
import { PILLARS, type PillarId, type ItemType } from "@/lib/constants/pillars";
import { hoursByPillar, balanceScore } from "@/lib/balance";
import { daysLeftInWeek, todayKey } from "@/lib/date";
import type { Item, PillarTargets } from "@/lib/types";

export interface CoachAction {
  pillar: PillarId;
  type: ItemType;
  title: string;
  label: string;
}
export interface CoachCard {
  tone: "good" | "warn";
  icon: string;
  title: string;
  text: string;
  action?: CoachAction;
}

const NUDGE: Record<PillarId, string> = {
  academics: "Aucune révision planifiée pour l’instant. Une courte session aujourd’hui ?",
  health: "Tu n’as presque pas pris de temps pour toi. Sommeil, marche, respiration… ça compte.",
  work: "Pense à caler tes heures de travail pour ne pas être pris de court.",
  sports: "Ton corps réclame un peu de mouvement. Même 30 min suffisent.",
  relationships: "Tes proches t’attendent. Prévois un moment ensemble.",
  finances: "Un court moment pour ton budget / tes démarches t’évitera du stress.",
  growth: "Et si tu avançais un peu sur un projet perso cette semaine ?",
};

export function coachInsights(opts: {
  weekItems: Item[];
  targets: PillarTargets;
  name: string;
  streak: number;
}): CoachCard[] {
  const { weekItems, targets, name, streak } = opts;
  const actual = hoursByPillar(weekItems);
  const score = balanceScore(weekItems, targets);
  const left = daysLeftInWeek();
  const out: CoachCard[] = [];

  // overload
  if (actual.academics > (targets.academics || 1) * 1.4) {
    out.push({
      tone: "warn",
      icon: "bolt",
      title: "Charge académique élevée",
      text: `${Math.round(actual.academics)} h d’études déjà cette semaine. Bloque une vraie pause santé pour éviter l’épuisement.`,
      action: { pillar: "health", type: "event", title: "Pause & repos", label: "Planifier une pause" },
    });
  }

  // neglected pillars (only meaningful if the week isn't almost over)
  if (left > 2) {
    for (const p of PILLARS) {
      const t = targets[p.id] ?? p.target;
      if (t > 0 && actual[p.id] < t * 0.2) {
        out.push({
          tone: "warn",
          icon: p.icon,
          title: `« ${p.label} » est en retrait`,
          text: NUDGE[p.id],
          action: {
            pillar: p.id,
            type: p.id === "academics" ? "study" : p.id === "sports" ? "task" : "event",
            title: "",
            label: `Ajouter ${p.label}`,
          },
        });
      }
    }
  }

  // next exam prep
  const nextExam = weekItems
    .concat()
    .filter((i) => i.type === "exam" && !i.done && i.date >= todayKey())
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (nextExam) {
    out.push({
      tone: "good",
      icon: "sparkles",
      title: `Prépare ${nextExam.title}`,
      text: "Examen prévu. Je te suggère 2 sessions de révision réparties d’ici là — pas de bachotage de dernière minute.",
      action: { pillar: nextExam.pillar, type: "study", title: `Révision ${nextExam.title}`, label: "Caler une révision" },
    });
  }

  // celebrate
  if (score >= 80) {
    out.push({ tone: "good", icon: "trophy", title: `Bravo ${name} !`, text: `Ton équilibre est à ${score}/100 — tu tiens une semaine vraiment saine. Continue comme ça. 🌿` });
  }
  if (streak >= 3) {
    out.push({ tone: "good", icon: "flame", title: `Série de ${streak} jours`, text: "Tu avances un peu chaque jour. La régularité bat l’intensité." });
  }

  if (out.length < 2) {
    out.push({ tone: "good", icon: "compass", title: "Une semaine bien partie", text: "Ajoute tes cours et échéances, et je t’aiderai à répartir ta charge sans sacrifier le reste." });
  }
  return out.slice(0, 6);
}
