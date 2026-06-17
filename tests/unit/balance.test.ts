import { describe, it, expect } from "vitest";
import { balanceScore, gpa, productivityScore } from "@/lib/balance";
import { PILLARS, type PillarId } from "@/lib/constants/pillars";
import type { Item, PillarTargets, Course } from "@/lib/types";

const targets = Object.fromEntries(PILLARS.map((p) => [p.id, p.target])) as PillarTargets;

function item(pillar: PillarId, minutes: number, done = false): Item {
  return { id: Math.random().toString(36), title: "x", pillar, type: "task", date: "2026-06-16", start_time: null, duration_min: minutes, done };
}

describe("balanceScore", () => {
  it("is 100 when every pillar exactly hits its target", () => {
    const items = PILLARS.map((p) => item(p.id, p.target * 60));
    expect(balanceScore(items, targets)).toBe(100);
  });

  it("penalizes under-allocation (empty week < 100)", () => {
    expect(balanceScore([], targets)).toBeLessThan(100);
  });

  it("penalizes over-allocation too (3x target < 100)", () => {
    const items = PILLARS.map((p) => item(p.id, p.target * 60 * 3));
    expect(balanceScore(items, targets)).toBeLessThan(100);
  });
});

describe("productivityScore", () => {
  it("rewards completed tasks", () => {
    const allDone = [item("academics", 60, true), item("academics", 60, true)];
    const noneDone = [item("academics", 60, false), item("academics", 60, false)];
    expect(productivityScore(allDone, targets)).toBeGreaterThan(productivityScore(noneDone, targets));
  });
});

describe("gpa", () => {
  it("computes a credit-weighted average", () => {
    const courses: Course[] = [
      { id: "1", name: "A", credits: 3, grade: "A" }, // 4.0
      { id: "2", name: "B", credits: 1, grade: "B" }, // 3.0
    ];
    expect(gpa(courses)).toBe(3.75); // (4*3 + 3*1) / 4
  });

  it("returns null without courses", () => {
    expect(gpa([])).toBeNull();
  });
});
