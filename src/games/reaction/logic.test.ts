import { describe, expect, it } from "vitest";
import {
  applyRound,
  createMatch,
  judgeTap,
  rivalDelayMs,
  waitDelayMs,
} from "./logic";

describe("reaction duel", () => {
  it("flags early taps as false starts", () => {
    expect(judgeTap("wait", 0, 200)).toBe("false");
  });

  it("awards the faster reaction", () => {
    expect(judgeTap("go", 180, 250)).toBe("win");
    expect(judgeTap("go", 300, 220)).toBe("lose");
  });

  it("ends the match at five wins", () => {
    let match = createMatch();
    for (let i = 0; i < 4; i += 1) {
      const step = applyRound(match, "win");
      match = step.match;
      expect(step.over).toBe(false);
    }
    const last = applyRound(match, "win");
    expect(last.over).toBe(true);
    expect(last.winner).toBe("you");
  });

  it("keeps delays in playable ranges", () => {
    expect(waitDelayMs(() => 0)).toBe(1200);
    expect(waitDelayMs(() => 0.999)).toBeGreaterThan(3000);
    expect(rivalDelayMs(() => 0)).toBe(190);
    expect(rivalDelayMs(() => 0.999)).toBeLessThan(360);
  });
});
