import { describe, expect, it } from "vitest";
import {
  createFlappy,
  flap,
  stepFlappy,
  FLAPPY_CONFIG,
  parseFlappyDiff,
  isFlapKey,
} from "./logic";

describe("flappy lite", () => {
  it("starts alive with an empty course", () => {
    const state = createFlappy(320, 480);
    expect(state.alive).toBe(true);
    expect(state.pipes).toHaveLength(0);
    expect(state.score).toBe(0);
    expect(state.spawnAcc).toBe(0);
  });

  it("does not spawn a pipe on the first frames", () => {
    const state = createFlappy(320, 480, "normal");
    for (let i = 0; i < 10; i += 1) stepFlappy(state);
    expect(state.pipes).toHaveLength(0);
    expect(state.alive).toBe(true);
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

  it("keeps hard tighter and faster than easy", () => {
    expect(FLAPPY_CONFIG.hard.pipeGap).toBeLessThan(FLAPPY_CONFIG.easy.pipeGap);
    expect(FLAPPY_CONFIG.hard.pipeSpeed).toBeGreaterThan(
      FLAPPY_CONFIG.easy.pipeSpeed,
    );
  });

  it("caps fall speed on hard", () => {
    const state = createFlappy(320, 480, "hard");
    state.bird.vy = 40;
    stepFlappy(state);
    expect(state.bird.vy).toBeLessThanOrEqual(FLAPPY_CONFIG.hard.maxFall);
  });

  it("parses difficulty from history summaries", () => {
    expect(parseFlappyDiff("hard · 4")).toBe("hard");
    expect(parseFlappyDiff("easy · 0")).toBe("easy");
    expect(parseFlappyDiff("score 3")).toBeNull();
  });

  it("recognizes flap keys", () => {
    expect(isFlapKey({ code: "Space", key: " " } as KeyboardEvent)).toBe(true);
    expect(isFlapKey({ code: "ArrowUp", key: "ArrowUp" } as KeyboardEvent)).toBe(
      true,
    );
    expect(isFlapKey({ code: "KeyA", key: "a" } as KeyboardEvent)).toBe(false);
  });
});
