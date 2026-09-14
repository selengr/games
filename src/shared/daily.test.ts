import { describe, expect, it } from "vitest";
import { getDailyChallenge, todayKey } from "./daily";

describe("daily challenge", () => {
  it("is stable for a given date", () => {
    const a = getDailyChallenge("2026-09-14");
    const b = getDailyChallenge("2026-09-14");
    expect(a).toEqual(b);
    expect(a.date).toBe("2026-09-14");
    expect([
      "snake",
      "memory",
      "rps",
      "tictactoe",
      "breakout",
      "balloons",
      "mole",
      "reaction",
    ]).toContain(a.game);
  });

  it("returns today's key as ISO date", () => {
    expect(todayKey(new Date("2026-01-02T12:00:00.000Z"))).toBe("2026-01-02");
  });
});
