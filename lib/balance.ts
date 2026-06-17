/**
 * Balance & productivity scoring — pure, framework-agnostic (usable on server
 * and client). Ported from the static demo `BalanceU new/js/store.js`.
 *
 * Balance score: for each pillar `s = max(0, 1 - |actual/target - 1|)`; the
 * overall score is the average across all pillars × 100. Both under- AND
 * over-allocation reduce the score — balance, not maximization.
 */
import { PILLARS, ITEM_TYPES, type PillarId } from "@/lib/constants/pillars";
import type { Item, PillarTargets, Course } from "@/lib/types";

export function hoursByPillar(items: Item[]): Record<PillarId, number> {
  const out = Object.fromEntries(PILLARS.map((p) => [p.id, 0])) as Record<PillarId, number>;
  for (const it of items) out[it.pillar] = (out[it.pillar] ?? 0) + it.duration_min / 60;
  return out;
}

export function balanceScore(items: Item[], targets: PillarTargets): number {
  const actual = hoursByPillar(items);
  let sum = 0;
  for (const p of PILLARS) {
    const t = targets[p.id] ?? p.target;
    const ratio = t > 0 ? actual[p.id] / t : actual[p.id] > 0 ? 2 : 1;
    sum += Math.max(0, 1 - Math.abs(ratio - 1));
  }
  return Math.round((sum / PILLARS.length) * 100);
}

export function verdict(score: number): string {
  if (score >= 85) return "Superbe équilibre";
  if (score >= 70) return "Bel équilibre";
  if (score >= 50) return "En bonne voie";
  return "À rééquilibrer";
}

/** 60% task completion this week + 40% study-hours vs academics target. */
export function productivityScore(weekItems: Item[], targets: PillarTargets): number {
  const completable = weekItems.filter((i) => ITEM_TYPES[i.type]?.completable);
  const done = completable.filter((i) => i.done).length;
  const compRate = completable.length ? done / completable.length : 0.6;
  const acadHours = hoursByPillar(weekItems).academics;
  const acadTarget = targets.academics || 1;
  const studyRatio = Math.min(1, acadHours / acadTarget);
  return Math.round((compRate * 0.6 + studyRatio * 0.4) * 100);
}

export function weekCompletion(weekItems: Item[]): { done: number; total: number } {
  const completable = weekItems.filter((i) => ITEM_TYPES[i.type]?.completable);
  return { done: completable.filter((i) => i.done).length, total: completable.length };
}

const GRADE_PTS: Record<string, number> = {
  A: 4, "A-": 3.7, "B+": 3.3, B: 3, "B-": 2.7, "C+": 2.3, C: 2, "C-": 1.7, D: 1, F: 0,
};

export function gpa(courses: Course[]): number | null {
  let pts = 0, cr = 0;
  for (const c of courses) {
    const g = c.grade ? GRADE_PTS[c.grade] : undefined;
    if (g != null) { pts += g * c.credits; cr += c.credits; }
  }
  return cr ? Number((pts / cr).toFixed(2)) : null;
}
