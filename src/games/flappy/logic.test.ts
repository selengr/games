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

  it("keeps hard challenging but more readable than easy", () => {
    expect(FLAPPY_CONFIG.hard.pipeGap).toBeLessThan(FLAPPY_CONFIG.easy.pipeGap);
    expect(FLAPPY_CONFIG.hard.pipeSpeed).toBeGreaterThan(
      FLAPPY_CONFIG.easy.pipeSpeed,
    );
    expect(FLAPPY_CONFIG.hard.centerBias).toBeGreaterThan(
      FLAPPY_CONFIG.normal.centerBias,
    );
    expect(FLAPPY_CONFIG.hard.maxFall).toBeGreaterThan(0);
  });

  it("caps fall speed on hard", () => {
    const state = createFlappy(320, 480, "hard");
    state.bird.vy = 40;
    stepFlappy(state);
    expect(state.bird.vy).toBeLessThanOrEqual(FLAPPY_CONFIG.hard.maxFall);
  });
});
