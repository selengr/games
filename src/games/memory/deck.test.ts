import { describe, expect, it } from "vitest";
import { allMatched, createDeck, pairCount } from "./deck";

describe("memory deck", () => {
  it("builds the right number of cards", () => {
    expect(createDeck("small")).toHaveLength(pairCount("small") * 2);
    expect(createDeck("normal")).toHaveLength(16);
    expect(createDeck("large")).toHaveLength(24);
  });

  it("starts unmatched", () => {
    expect(allMatched(createDeck("small"))).toBe(false);
  });

  it("reports all matched", () => {
    const cards = createDeck("small").map((c) => ({ ...c, matched: true }));
    expect(allMatched(cards)).toBe(true);
  });
});
