/**
 * The 7 life pillars — single source of truth (mirrors the DB `pillar` enum
 * and the static demo). Colors are CSS variables (theme-aware); read the raw
 * hex at runtime with `pillarColor()` when a literal is required (e.g. SVG).
 */
export const PILLAR_IDS = [
  "academics",
  "health",
  "work",
  "sports",
  "relationships",
  "finances",
  "growth",
] as const;

export type PillarId = (typeof PILLAR_IDS)[number];

export interface Pillar {
  id: PillarId;
  label: string;
  icon: string;
  /** default weekly target, in hours */
  target: number;
  blurb: string;
  /** CSS variable, e.g. var(--p-academics) */
  colorVar: string;
}

export const PILLARS: Pillar[] = [
  { id: "academics", label: "Études", icon: "book", target: 14, blurb: "Cours, lectures, révisions.", colorVar: "var(--p-academics)" },
  { id: "health", label: "Santé", icon: "heart", target: 4, blurb: "Sommeil, repos, soin de soi.", colorVar: "var(--p-health)" },
  { id: "work", label: "Travail", icon: "briefcase", target: 8, blurb: "Job, stage, missions.", colorVar: "var(--p-work)" },
  { id: "sports", label: "Sport", icon: "activity", target: 4, blurb: "Entraînement, mouvement.", colorVar: "var(--p-sports)" },
  { id: "relationships", label: "Relations", icon: "users", target: 5, blurb: "Amis, famille, couple.", colorVar: "var(--p-relationships)" },
  { id: "finances", label: "Finances", icon: "wallet", target: 2, blurb: "Budget, démarches.", colorVar: "var(--p-finances)" },
  { id: "growth", label: "Développement", icon: "seedling", target: 3, blurb: "Projets, lecture, skills.", colorVar: "var(--p-growth)" },
];

const PILLAR_MAP: Record<PillarId, Pillar> = Object.fromEntries(
  PILLARS.map((p) => [p.id, p])
) as Record<PillarId, Pillar>;

export function getPillar(id: PillarId): Pillar {
  return PILLAR_MAP[id] ?? PILLARS[0];
}

/** Read the live pillar color (follows light/dark theme). Browser only. */
export function pillarColor(id: PillarId): string {
  if (typeof window === "undefined") return "#3E5A45";
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--p-${id}`);
  return v.trim() || "#3E5A45";
}

/** Item kinds that live in the planner. */
export const ITEM_TYPES = {
  class: { label: "Cours", icon: "grad", completable: false },
  study: { label: "Révision", icon: "book", completable: true },
  exam: { label: "Examen", icon: "trophy", completable: true },
  task: { label: "Tâche", icon: "check-circle", completable: true },
  work: { label: "Travail", icon: "briefcase", completable: true },
  event: { label: "Moment", icon: "heart", completable: false },
} as const;

export type ItemType = keyof typeof ITEM_TYPES;
