import { loadJson } from "./storage";

export type PlayerStats = {
  snakeBest: number;
  tttWins: number;
  tttLosses: number;
  tttDraws: number;
  rpsWins: number;
  rpsBestStreak: number;
  memoryBestMoves: number | null;
  memoryBestSeconds: number | null;
};

export function collectStats(): PlayerStats {
  const ttt = loadJson<{ wins: number; losses: number; draws: number }>(
    "arcade-ttt-scores",
    { wins: 0, losses: 0, draws: 0 },
  );
  const rps = loadJson<{ wins: number; bestStreak: number }>(
    "arcade-rps-stats",
    { wins: 0, bestStreak: 0 },
  );
  const memory = loadJson<{ moves: number; seconds: number } | null>(
    "arcade-memory-best-v2",
    null,
  );

  return {
    snakeBest: loadJson<number>("arcade-snake-best", 0),
    tttWins: ttt.wins,
    tttLosses: ttt.losses,
    tttDraws: ttt.draws,
    rpsWins: rps.wins,
    rpsBestStreak: rps.bestStreak,
    memoryBestMoves: memory?.moves ?? null,
    memoryBestSeconds: memory?.seconds ?? null,
  };
}

export function hasAnyStats(stats: PlayerStats): boolean {
  return (
    stats.snakeBest > 0 ||
    stats.tttWins + stats.tttLosses + stats.tttDraws > 0 ||
    stats.rpsWins > 0 ||
    stats.memoryBestMoves !== null
  );
}
