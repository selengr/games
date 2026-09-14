import { describe, expect, it } from "vitest";
import { createFlappy, flap, stepFlappy, FLAPPY_CONFIG } from "./logic";

describe("flappy lite", () => {
  it("starts alive with an empty course", () => {
    const state = createFlappy(320, 480);
    expect(state.alive).toBe(true);
    expect(state.pipes).toHaveLength(0);
    expect(state.score).toBe(0);
  });

  it("flap lifts the bird", () => {
    const state = createFlappy(320, 480);
    const y = state.bird.y;
    flap(state);
    stepFlappy(state);
    expect(state.bird.y).toBeLessThan(y);
  });

  it("dies when falling through the floor", () => {
    const state = createFlappy(320, 480);
    state.bird.y = state.height - 2;
    state.bird.vy = 8;
    expect(stepFlappy(state)).toBe("die");
    expect(state.alive).toBe(false);
  });

  it("uses tighter gaps on hard", () => {
    expect(FLAPPY_CONFIG.hard.pipeGap).toBeLessThan(FLAPPY_CONFIG.easy.pipeGap);
    expect(FLAPPY_CONFIG.hard.pipeSpeed).toBeGreaterThan(
      FLAPPY_CONFIG.easy.pipeSpeed,
    );
  });
});
