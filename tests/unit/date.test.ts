import { describe, it, expect } from "vitest";
import { weekStart, toKey, weekDays, fmtHours } from "@/lib/date";

describe("date helpers", () => {
  it("weekStart returns a Monday", () => {
    // 2026-06-17 is a Wednesday → week starts Monday 2026-06-15
    expect(weekStart(new Date(2026, 5, 17)).getDay()).toBe(1);
    expect(toKey(weekStart(new Date(2026, 5, 17)))).toBe("2026-06-15");
  });

  it("weekDays returns 7 consecutive days", () => {
    const days = weekDays(new Date(2026, 5, 17));
    expect(days).toHaveLength(7);
    expect(toKey(days[0])).toBe("2026-06-15");
    expect(toKey(days[6])).toBe("2026-06-21");
  });

  it("formats hours", () => {
    expect(fmtHours(0)).toBe("0 h");
    expect(fmtHours(1.5)).toBe("1 h30");
    expect(fmtHours(2)).toBe("2 h");
  });
});
