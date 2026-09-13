export type Card = {
  id: number;
  symbol: string;
  matched: boolean;
};

export type BoardSize = "small" | "normal" | "large";

const SYMBOLS = ["⬡", "◆", "▲", "●", "★", "✚", "◈", "▮", "✕", "◎", "◇", "▣"];

export function pairCount(size: BoardSize): number {
  if (size === "small") return 6;
  if (size === "large") return 12;
  return 8;
}

export function columnsFor(size: BoardSize): number {
  if (size === "small") return 4;
  if (size === "large") return 6;
  return 4;
}

export function createDeck(size: BoardSize = "normal"): Card[] {
  const count = pairCount(size);
  const chosen = SYMBOLS.slice(0, count);
  const pairs = chosen.flatMap((symbol, i) => [
    { id: i * 2, symbol, matched: false },
    { id: i * 2 + 1, symbol, matched: false },
  ]);

  for (let i = pairs.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pairs[i]!;
    pairs[i] = pairs[j]!;
    pairs[j] = tmp;
  }

  return pairs;
}

export function allMatched(cards: Card[]): boolean {
  return cards.every((card) => card.matched);
}
