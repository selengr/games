export type Phase = "wait" | "go" | "result" | "false" | "match";

export type RoundResult = "win" | "lose" | "false";

export type MatchState = {
  you: number;
  rival: number;
  target: number;
};

export const MATCH_TARGET = 5;

export function createMatch(): MatchState {
  return { you: 0, rival: 0, target: MATCH_TARGET };
}

/** Random wait before the GO signal (ms). */
export function waitDelayMs(rand = Math.random): number {
  return 1200 + Math.floor(rand() * 2300);
}

/** Rival reaction time after GO (ms). */
export function rivalDelayMs(rand = Math.random): number {
  return 190 + Math.floor(rand() * 160);
}

export function judgeTap(
  phase: Phase,
  playerMs: number,
  rivalMs: number,
): RoundResult {
  if (phase === "wait") return "false";
  if (phase !== "go") return "lose";
  return playerMs <= rivalMs ? "win" : "lose";
}

export function applyRound(
  match: MatchState,
  result: RoundResult,
): { match: MatchState; over: boolean; winner: "you" | "rival" | null } {
  const next = { ...match };
  if (result === "win") next.you += 1;
  else next.rival += 1;
  if (next.you >= next.target) {
    return { match: next, over: true, winner: "you" };
  }
  if (next.rival >= next.target) {
    return { match: next, over: true, winner: "rival" };
  }
  return { match: next, over: false, winner: null };
}
