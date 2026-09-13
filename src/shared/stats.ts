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

  const memoryCandidates = [
    loadJson<{ moves: number; seconds: number } | null>(
      "arcade-memory-best-normal",
      null,
    ),
    loadJson<{ moves: number; seconds: number } | null>(
      "arcade-memory-best-v2",
      null,
    ),
    loadJson<{ moves: number; seconds: number } | null>(
      "arcade-memory-best-small",
      null,
    ),
    loadJson<{ moves: number; seconds: number } | null>(
      "arcade-memory-best-large",
      null,
    ),
  ].filter(Boolean) as Array<{ moves: number; seconds: number }>;

  const memory =
    memoryCandidates.sort((a, b) =>
      a.moves === b.moves ? a.seconds - b.seconds : a.moves - b.moves,
    )[0] ?? null;

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

function formatTime(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function renderStatsBlock(stats: PlayerStats): string {
  if (!hasAnyStats(stats)) {
    return `
      <section class="stats-panel panel">
        <h2>Your run</h2>
        <p class="muted">Play a few rounds and your bests will show up here.</p>
      </section>
    `;
  }

  return `
    <section class="stats-panel panel" aria-label="Player stats">
      <h2>Your run</h2>
      <p class="muted">Saved on this device.</p>
      <div class="stats-grid">
        <div class="stat-card"><span>Snake best</span><strong>${stats.snakeBest}</strong></div>
        <div class="stat-card"><span>TTT record</span><strong>${stats.tttWins}-${stats.tttLosses}-${stats.tttDraws}</strong></div>
        <div class="stat-card"><span>RPS wins</span><strong>${stats.rpsWins}</strong></div>
        <div class="stat-card"><span>RPS streak</span><strong>${stats.rpsBestStreak}</strong></div>
        <div class="stat-card"><span>Memory best</span><strong>${
          stats.memoryBestMoves === null
            ? "—"
            : `${stats.memoryBestMoves} / ${formatTime(stats.memoryBestSeconds ?? 0)}`
        }</strong></div>
      </div>
    </section>
  `;
}
