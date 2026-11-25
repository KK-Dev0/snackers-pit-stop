import { describe, expect, it } from "vitest";

import { addDays, formatWeekLabel, weekStartForDate } from "@/lib/weeks";

describe("week helpers", () => {
  it("normalizes a midweek date to its Monday", () => {
    expect(weekStartForDate("2026-11-25")).toBe("2026-11-23");
    expect(weekStartForDate(new Date("2026-11-29T23:00:00Z"))).toBe("2026-11-23");
  });

  it("moves by whole weeks across month and year boundaries", () => {
    expect(addDays("2026-11-30", 7)).toBe("2026-12-07");
    expect(addDays("2027-01-04", -7)).toBe("2026-12-28");
  });

  it("formats a week label in UTC", () => {
    expect(formatWeekLabel("2026-11-23")).toBe("23 Nov");
  });
});
