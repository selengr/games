import { describe, expect, it } from "vitest";
import {
  createHoles,
  hideExpired,
  spawnMole,
  whack,
  upMsForScore,
} from "./logic";

describe("mole logic", () => {
  it("creates nine holes", () => {
    expect(createHoles()).toHaveLength(9);
  });

  it("spawns then whacks a mole", () => {
    const holes = createHoles();
    const mole = spawnMole(holes, 1000, 800);
    expect(mole?.up).toBe(true);
    expect(whack(holes, mole!.id)).toBe(true);
    expect(holes[mole!.id]?.up).toBe(false);
  });

  it("counts a miss when time expires", () => {
    const holes = createHoles();
    spawnMole(holes, 1000, 500);
    expect(hideExpired(holes, 1600)).toBe(1);
  });

  it("speeds up as score rises", () => {
    expect(upMsForScore(20)).toBeLessThan(upMsForScore(0));
  });
});
