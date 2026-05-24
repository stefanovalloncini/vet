import { describe, expect, it } from "vitest";
import { formatRelativeDay } from "../formatRelativeDay";

const NOW = new Date("2026-05-24T10:00:00");

describe("formatRelativeDay", () => {
  it("returns 'oggi' for the same day", () => {
    expect(formatRelativeDay(new Date("2026-05-24T07:00:00"), NOW)).toBe("oggi");
  });

  it("returns 'ieri' for the day before", () => {
    expect(formatRelativeDay(new Date("2026-05-23T20:00:00"), NOW)).toBe("ieri");
  });

  it("returns 'Xg fa' for 2–6 days ago", () => {
    expect(formatRelativeDay(new Date("2026-05-22"), NOW)).toBe("2g fa");
    expect(formatRelativeDay(new Date("2026-05-18"), NOW)).toBe("6g fa");
  });

  it("returns short Italian date for entries older than a week", () => {
    expect(formatRelativeDay(new Date("2026-05-10"), NOW)).toBe("10/5");
    expect(formatRelativeDay(new Date("2026-04-03"), NOW)).toBe("3/4");
  });

  it("returns short Italian date for future entries", () => {
    expect(formatRelativeDay(new Date("2026-05-30"), NOW)).toBe("30/5");
  });
});
