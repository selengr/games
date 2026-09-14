import { loadJson, removeJson } from "./storage";
import {
  ACHIEVEMENTS,
  clearAchievements,
  unlockedIds,
} from "./achievements";

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
    snakeBest: Math.max(
      loadJson<number>("arcade-snake-best", 0),
      loadJson<number>("arcade-snake-best-chill", 0),
      loadJson<number>("arcade-snake-best-normal", 0),
      loadJson<number>("arcade-snake-best-insane", 0),
    ),
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

export function clearAllProgress(): void {
  const keys = [
    "arcade-snake-best",
    "arcade-snake-best-chill",
    "arcade-snake-best-normal",
    "arcade-snake-best-insane",
    "arcade-ttt-scores",
    "arcade-rps-stats",
    "arcade-memory-best-v2",
    "arcade-memory-best-small",
    "arcade-memory-best-normal",
    "arcade-memory-best-large",
  ];
  for (const key of keys) removeJson(key);
  clearAchievements();
  removeJson("arcade-history");
  removeJson("arcade-daily");
  removeJson("arcade-daily-active");
}

function formatTime(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function renderStatsBlock(stats: PlayerStats): string {
  const unlocked = new Set(unlockedIds());

  return `
    <section class="stats-panel panel" aria-label="Player stats">
      <h2>Your run</h2>
      <p class="muted">${
        hasAnyStats(stats)
          ? "Saved on this device."
          : "Play a few rounds and your bests will show up here."
      }</p>
      ${
        hasAnyStats(stats)
          ? `<div class="stats-grid">
        <div class="stat-card"><span>Snake best</span><strong>${stats.snakeBest}</strong></div>
        <div class="stat-card"><span>TTT record</span><strong>${stats.tttWins}-${stats.tttLosses}-${stats.tttDraws}</strong></div>
        <div class="stat-card"><span>RPS wins</span><strong>${stats.rpsWins}</strong></div>
        <div class="stat-card"><span>RPS streak</span><strong>${stats.rpsBestStreak}</strong></div>
        <div class="stat-card"><span>Memory best</span><strong>${
          stats.memoryBestMoves === null
            ? "—"
            : `${stats.memoryBestMoves} / ${formatTime(stats.memoryBestSeconds ?? 0)}`
        }</strong></div>
      </div>`
          : ""
      }
      <h3 style="margin:1.1rem 0 0;font-family:var(--font-display);font-size:1.1rem">
        Badges ${unlocked.size}/${ACHIEVEMENTS.length}
      </h3>
      <div class="achieve-grid">
        ${ACHIEVEMENTS.map(
          (a) => `
          <div class="achieve-card ${unlocked.has(a.id) ? "on" : ""}">
            <strong>${a.title}</strong>
            <span>${a.detail}</span>
          </div>
        `,
        ).join("")}
      </div>
      <div class="row" style="margin-top:1rem">
        <button class="btn btn-ghost" type="button" data-reset-all>Reset all progress</button>
      </div>
    </section>
  `;
}
