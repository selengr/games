import type { Route } from "./router";

/** Map history display titles to playable routes (legacy rows included). */
const TITLE_TO_ROUTE: Record<string, Exclude<Route, "hub">> = {
  Snake: "snake",
  "Flappy Lite": "flappy",
  Breakout: "breakout",
  "Balloon Pop": "balloons",
  "Whack-a-Mole": "mole",
  "Reaction Duel": "reaction",
  "Tic-Tac-Toe": "tictactoe",
  Memory: "memory",
};

export function routeFromHistoryTitle(
  title: string,
): Exclude<Route, "hub"> | null {
  return TITLE_TO_ROUTE[title] ?? null;
}
