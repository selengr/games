import { describe, expect, it } from "vitest";
import { canTurn, step, startSnake, spawnFood } from "./logic";

describe("snake logic", () => {
  it("starts with three segments", () => {
    expect(startSnake()).toHaveLength(3);
  });

  it("blocks turning into yourself", () => {
    expect(canTurn("right", "left")).toBe(false);
    expect(canTurn("right", "up")).toBe(true);
  });

  it("moves forward and can wrap", () => {
    const snake = [{ x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }];
    const food = { x: 8, y: 8 };
    const result = step(snake, "left", food, true);
    expect(result.dead).toBe(false);
    expect(result.snake[0]).toEqual({ x: 15, y: 5 });
  });

  it("dies on wall without wrap", () => {
    const snake = [{ x: 0, y: 5 }, { x: 1, y: 5 }];
    const food = spawnFood(snake);
    const result = step(snake, "left", food, false);
    expect(result.dead).toBe(true);
  });

  it("grows when eating", () => {
    const snake = [{ x: 4, y: 4 }, { x: 3, y: 4 }];
    const food = { x: 5, y: 4 };
    const result = step(snake, "right", food, false);
    expect(result.ate).toBe(true);
    expect(result.snake).toHaveLength(3);
  });
});
