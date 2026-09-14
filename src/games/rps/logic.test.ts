import { describe, expect, it } from "vitest";
import { decide, MOVES } from "./logic";

describe("rps logic", () => {
  it("has three moves", () => {
    expect(MOVES).toHaveLength(3);
  });

  it("resolves the usual winners", () => {
    expect(decide("rock", "scissors")).toBe("win");
    expect(decide("paper", "rock")).toBe("win");
    expect(decide("scissors", "paper")).toBe("win");
    expect(decide("rock", "paper")).toBe("lose");
    expect(decide("rock", "rock")).toBe("draw");
  });
});
