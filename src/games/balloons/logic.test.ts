import { describe, expect, it } from "vitest";
import { hitBalloon, type Balloon } from "./logic";

function balloon(partial: Partial<Balloon> & Pick<Balloon, "x" | "y" | "r">): Balloon {
  return {
    id: 1,
    speed: 1,
    color: "#fff",
    alive: true,
    ...partial,
  };
}

describe("hitBalloon", () => {
  it("hits when tap is inside the balloon", () => {
    const list = [balloon({ x: 100, y: 100, r: 20 })];
    expect(hitBalloon(list, 100, 100, 0)?.alive).toBe(false);
  });

  it("misses just outside without pad", () => {
    const list = [balloon({ x: 100, y: 100, r: 20 })];
    expect(hitBalloon(list, 100, 121, 0)).toBeNull();
  });

  it("forgives near misses with pad", () => {
    const list = [balloon({ x: 100, y: 100, r: 20 })];
    expect(hitBalloon(list, 100, 130, 14)?.id).toBe(1);
  });
});
