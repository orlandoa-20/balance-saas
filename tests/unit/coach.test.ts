import { describe, it, expect } from "vitest";
import { coachInsights } from "@/lib/coach";
import { PILLARS, type PillarId } from "@/lib/constants/pillars";
import type { Item, PillarTargets } from "@/lib/types";

const targets = Object.fromEntries(PILLARS.map((p) => [p.id, p.target])) as PillarTargets;
const item = (pillar: PillarId, minutes: number): Item => ({
  id: Math.random().toString(36), title: "x", pillar, type: "task", date: "2026-06-16", start_time: null, duration_min: minutes, done: false,
});
const base = { targets, name: "Alex", upcoming: [] as Item[], completion: { done: 0, total: 0 } };

describe("coachInsights", () => {
  it("always returns at least one card", () => {
    expect(coachInsights({ ...base, weekItems: [], streak: 0 }).length).toBeGreaterThanOrEqual(1);
  });

  it("celebrates a perfectly balanced week", () => {
    const items = PILLARS.map((p) => item(p.id, p.target * 60));
    const cards = coachInsights({ ...base, weekItems: items, streak: 5 });
    expect(cards.some((c) => c.tone === "good")).toBe(true);
  });

  it("flags academic overload", () => {
    const items = [item("academics", targets.academics * 60 * 2)];
    const cards = coachInsights({ ...base, weekItems: items, streak: 0 });
    expect(cards.some((c) => c.title.includes("Charge académique"))).toBe(true);
  });

  it("surfaces an upcoming exam deadline", () => {
    const exam: Item = { id: "e", title: "Partiel", pillar: "academics", type: "exam", date: "2099-01-01", start_time: null, duration_min: 120, done: false };
    const cards = coachInsights({ ...base, weekItems: [], streak: 0, upcoming: [exam] });
    expect(cards.some((c) => c.title.includes("Partiel"))).toBe(true);
  });
});
