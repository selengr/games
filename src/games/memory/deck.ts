export type Card = {
  id: number;
  symbol: string;
  matched: boolean;
};

const SYMBOLS = ["⬡", "◆", "▲", "●", "★", "✚", "◈", "▮"];

export function createDeck(): Card[] {
  const pairs = SYMBOLS.flatMap((symbol, i) => [
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
