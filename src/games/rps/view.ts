import { setRoute } from "../../shared/router";
import { loadJson, saveJson } from "../../shared/storage";
import {
  decide,
  glyph,
  label,
  MOVES,
  randomMove,
  type Move,
  type Outcome,
} from "./logic";
import "./rps.css";

type Stats = {
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  bestStreak: number;
};

const STATS_KEY = "arcade-rps-stats";

export function renderRps(root: HTMLElement): void {
  let stats = loadJson<Stats>(STATS_KEY, {
    wins: 0,
    losses: 0,
    draws: 0,
    streak: 0,
    bestStreak: 0,
  });
  let lastPlayer: Move | null = null;
  let lastCpu: Move | null = null;
  let lastOutcome: Outcome | null = null;

  const paint = (): void => {
    const resultText =
      lastOutcome === "win"
        ? "You win this round."
        : lastOutcome === "lose"
          ? "CPU takes it."
          : lastOutcome === "draw"
            ? "Tie."
            : "Pick your move.";

    root.innerHTML = `
      <div class="shell">
        <div class="brand-bar">
          <p class="brand">Arcade Hub</p>
          <button class="back-btn" type="button" data-back>← All games</button>
        </div>
        <section class="panel">
          <h2>Rock Paper Scissors</h2>
          <p class="muted">Track your streak. Local stats stick around between visits.</p>
          <div class="scoreboard">
            <span class="score-pill">W ${stats.wins}</span>
            <span class="score-pill">L ${stats.losses}</span>
            <span class="score-pill">D ${stats.draws}</span>
            <span class="score-pill">Streak ${stats.streak}</span>
            <span class="score-pill">Best ${stats.bestStreak}</span>
          </div>
          <div class="rps-arena" aria-live="polite">
            <div class="rps-side">
              <span class="big">${lastPlayer ? glyph(lastPlayer) : "?"}</span>
              <strong>You</strong>
              <div class="muted">${lastPlayer ? label(lastPlayer) : "—"}</div>
            </div>
            <div class="rps-vs">VS</div>
            <div class="rps-side">
              <span class="big">${lastCpu ? glyph(lastCpu) : "?"}</span>
              <strong>CPU</strong>
              <div class="muted">${lastCpu ? label(lastCpu) : "—"}</div>
            </div>
          </div>
          <p class="status">${resultText}</p>
          <div class="rps-choices">
            ${MOVES.map(
              (move) => `
              <button class="rps-btn" type="button" data-move="${move}">
                <span class="glyph">${glyph(move)}</span>
                <span class="name">${label(move)}</span>
              </button>
            `,
            ).join("")}
          </div>
          <div class="row">
            <button class="btn btn-ghost" type="button" data-reset-stats>Reset stats</button>
          </div>
        </section>
      </div>
    `;

    root.querySelector("[data-back]")?.addEventListener("click", () => setRoute("hub"));
    root.querySelector("[data-reset-stats]")?.addEventListener("click", () => {
      stats = { wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0 };
      saveJson(STATS_KEY, stats);
      lastPlayer = null;
      lastCpu = null;
      lastOutcome = null;
      paint();
    });

    root.querySelectorAll<HTMLButtonElement>("[data-move]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const player = btn.dataset.move as Move;
        const cpu = randomMove();
        const outcome = decide(player, cpu);
        lastPlayer = player;
        lastCpu = cpu;
        lastOutcome = outcome;

        if (outcome === "win") {
          stats.wins += 1;
          stats.streak += 1;
          stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
        } else if (outcome === "lose") {
          stats.losses += 1;
          stats.streak = 0;
        } else {
          stats.draws += 1;
        }

        saveJson(STATS_KEY, stats);
        paint();
      });
    });
  };

  paint();
}
