/**
 * Deterministic coach engine — data-driven, synced with the user's real week:
 * completed, pending (today/this week), upcoming deadlines, and weekly
 * objectives (per-pillar targets). Never generic. The Pro tier layers an LLM
 * study plan on top (see lib/coach-ai.ts).
 */
import { PILLARS, ITEM_TYPES, type PillarId, type ItemType } from "@/lib/constants/pillars";
import { hoursByPillar, balanceScore } from "@/lib/balance";
import { daysLeftInWeek, todayKey, daysUntil } from "@/lib/date";
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
  academics: "Aucune révision planifiée cette semaine. Une courte session aujourd'hui ?",
  health: "Tu n'as presque pas pris de temps pour toi. Sommeil, marche, respiration… ça compte.",
  work: "Pense à caler tes heures de travail pour ne pas être pris de court.",
  sports: "Ton corps réclame un peu de mouvement. Même 30 min suffisent.",
  relationships: "Tes proches t'attendent. Prévois un moment ensemble.",
  finances: "Un court moment pour ton budget / tes démarches t'évitera du stress.",
  growth: "Et si tu avançais un peu sur un projet perso cette semaine ?",
};

function whenLabel(d: number): string {
  return d <= 0 ? "aujourd'hui" : d === 1 ? "demain" : `dans ${d} jours`;
}

export function coachInsights(opts: {
  weekItems: Item[];
  targets: PillarTargets;
  name: string;
  streak: number;
  upcoming: Item[]; // soonest not-done deadlines (exam/task/study), today onward
  completion: { done: number; total: number };
}): CoachCard[] {
  const { weekItems, targets, name, streak, upcoming, completion } = opts;
  const actual = hoursByPillar(weekItems);
  const score = balanceScore(weekItems, targets);
  const left = daysLeftInWeek();
  const tk = todayKey();
  const out: CoachCard[] = [];

  // 1) overload
  if (actual.academics > (targets.academics || 1) * 1.4) {
    out.push({
      tone: "warn", icon: "bolt", title: "Charge académique élevée",
      text: `${Math.round(actual.academics)} h d'études déjà cette semaine. Bloque une vraie pause pour éviter l'épuisement.`,
      action: { pillar: "health", type: "event", title: "Pause & repos", label: "Planifier une pause" },
    });
  }

  // 2) pending TODAY
  const pendingToday = weekItems.filter((i) => i.date === tk && !i.done && ITEM_TYPES[i.type]?.completable);
  if (pendingToday.length) {
    const titles = pendingToday.slice(0, 3).map((i) => i.title).join(", ");
    out.push({
      tone: "warn", icon: "clock",
      title: `${pendingToday.length} tâche${pendingToday.length > 1 ? "s" : ""} encore aujourd'hui`,
      text: `À cocher avant ce soir : ${titles}${pendingToday.length > 3 ? "…" : ""}.`,
    });
  }

  // 3) upcoming deadline — prioritize the next exam, else next deadline
  const nextExam = upcoming.find((i) => i.type === "exam");
  const target = nextExam ?? upcoming[0];
  if (target) {
    const d = daysUntil(target.date);
    out.push({
      tone: "good", icon: nextExam ? "sparkles" : "calendar",
      title: nextExam ? `Examen « ${target.title} » ${whenLabel(d)}` : `Échéance « ${target.title} » ${whenLabel(d)}`,
      text: nextExam
        ? "Je te suggère 2 sessions de révision réparties d'ici là — pas de bachotage de dernière minute."
        : "Réserve un créneau dès maintenant pour l'avancer sereinement.",
      action: { pillar: target.pillar, type: "study", title: nextExam ? `Révision ${target.title}` : target.title, label: nextExam ? "Caler une révision" : "Planifier" },
    });
  }

  // 4) neglected weekly objectives (cap 2 so they don't flood)
  if (left > 2) {
    let count = 0;
    for (const p of PILLARS) {
      if (count >= 2) break;
      const t = targets[p.id] ?? p.target;
      if (t > 0 && actual[p.id] < t * 0.2) {
        out.push({
          tone: "warn", icon: p.icon, title: `Objectif « ${p.label} » en retard`,
          text: `${actual[p.id].toFixed(1)} h / ${t} h cette semaine. ${NUDGE[p.id]}`,
          action: { pillar: p.id, type: p.id === "academics" ? "study" : p.id === "sports" ? "task" : "event", title: "", label: `Ajouter ${p.label}` },
        });
        count++;
      }
    }
  }

  // 5) weekly progress (completed vs planned)
  if (completion.total > 0) {
    const pct = Math.round((completion.done / completion.total) * 100);
    out.push({
      tone: "good", icon: "check-circle",
      title: `${completion.done}/${completion.total} tâches faites cette semaine (${pct}%)`,
      text: pct >= 70
        ? `Belle semaine, ${name} — tu tiens le rythme.`
        : pct >= 30
          ? "Bonne lancée. Coche-en une ou deux de plus aujourd'hui pour garder l'élan."
          : "Commence petit : une seule tâche cochée change toute la dynamique.",
    });
  }

  // 6) celebrate
  if (score >= 80) out.push({ tone: "good", icon: "trophy", title: `Équilibre ${score}/100`, text: `Semaine vraiment saine, ${name}. Protège cet équilibre. 🌿` });
  if (streak >= 3) out.push({ tone: "good", icon: "flame", title: `Série de ${streak} jours`, text: "La régularité bat l'intensité. Continue un petit pas chaque jour." });

  if (out.length < 2) {
    out.push({ tone: "good", icon: "compass", title: "Une semaine bien partie", text: "Ajoute tes cours et échéances, et je t'aiderai à répartir ta charge sans sacrifier le reste." });
  }
  return out.slice(0, 6);
}
