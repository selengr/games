import { bindChrome, renderChrome } from "../../shared/chrome";
import { sfx, unlockAudio } from "../../shared/audio";
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

type Match = {
  you: number;
  cpu: number;
  target: number;
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
  let match: Match = { you: 0, cpu: 0, target: 3 };
  let lastPlayer: Move | null = null;
  let lastCpu: Move | null = null;
  let lastOutcome: Outcome | null = null;
  let matchOver: "you" | "cpu" | null = null;

  const paint = (): void => {
    const resultText =
      matchOver === "you"
        ? "You took the match!"
        : matchOver === "cpu"
          ? "CPU won the match."
          : lastOutcome === "win"
            ? "You win this round."
            : lastOutcome === "lose"
              ? "CPU takes it."
              : lastOutcome === "draw"
                ? "Tie."
                : "Pick your move.";

    root.innerHTML = `
      <div class="shell route-fade">
        ${renderChrome({ showBack: true })}
        <section class="panel">
          <h2>Rock Paper Scissors</h2>
          <p class="muted">First to ${match.target}. Streaks and career stats stay on this device.</p>
          <div class="scoreboard">
            <span class="score-pill">Match ${match.you}–${match.cpu}</span>
            <span class="score-pill">W ${stats.wins}</span>
            <span class="score-pill">L ${stats.losses}</span>
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
          ${
            matchOver
              ? `<div class="overlay-card"><strong>${resultText}</strong>Start a new match when you're ready.</div>`
              : ""
          }
          <div class="rps-choices">
            ${MOVES.map(
              (move) => `
              <button class="rps-btn" type="button" data-move="${move}" ${matchOver ? "disabled" : ""}>
                <span class="glyph">${glyph(move)}</span>
                <span class="name">${label(move)}</span>
              </button>
            `,
            ).join("")}
          </div>
          <div class="row">
            <button class="btn btn-primary" type="button" data-new-match>New match</button>
            <button class="btn btn-ghost" type="button" data-reset-stats>Reset stats</button>
          </div>
        </section>
      </div>
    `;

    bindChrome(root, paint);

    root.querySelector("[data-new-match]")?.addEventListener("click", () => {
      sfx.tap();
      match = { you: 0, cpu: 0, target: 3 };
      matchOver = null;
      lastPlayer = null;
      lastCpu = null;
      lastOutcome = null;
      paint();
    });

    root.querySelector("[data-reset-stats]")?.addEventListener("click", () => {
      sfx.tap();
      stats = { wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0 };
      saveJson(STATS_KEY, stats);
      match = { you: 0, cpu: 0, target: 3 };
      matchOver = null;
      lastPlayer = null;
      lastCpu = null;
      lastOutcome = null;
      paint();
    });

    root.querySelectorAll<HTMLButtonElement>("[data-move]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (matchOver) return;
        unlockAudio();
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
          match.you += 1;
          sfx.win();
        } else if (outcome === "lose") {
          stats.losses += 1;
          stats.streak = 0;
          match.cpu += 1;
          sfx.lose();
        } else {
          stats.draws += 1;
          sfx.draw();
        }

        if (match.you >= match.target) matchOver = "you";
        if (match.cpu >= match.target) matchOver = "cpu";

        saveJson(STATS_KEY, stats);
        paint();
      });
    });
  };

  paint();
}
