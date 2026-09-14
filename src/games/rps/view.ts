import { bindChrome, renderChrome } from "../../shared/chrome";
import { sfx, unlockAudio } from "../../shared/audio";
import { loadJson, saveJson } from "../../shared/storage";
import { checkRpsStreak, markPlayed } from "../../shared/achievements";
import { announceUnlocks } from "../../shared/toast";
import { burstAtElement } from "../../shared/fx";
import { pushHistory } from "../../shared/history";
import { maybeCompleteDaily } from "../../shared/dailyComplete";
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
  markPlayed("rps");
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
        ? "You win!"
        : matchOver === "cpu"
          ? "You lose"
          : lastOutcome === "win"
            ? "Nice!"
            : lastOutcome === "lose"
              ? "Oops"
              : lastOutcome === "draw"
                ? "Tie"
                : "Pick one";

    root.innerHTML = `
      <div class="shell route-fade">
        ${renderChrome({ showBack: true })}
        <section class="panel">
          <h2>Rock Paper Scissors</h2>
          <div class="scoreboard">
            <span class="score-pill">${match.you} – ${match.cpu}</span>
          </div>
          <div class="rps-arena" aria-live="polite">
            <div class="rps-side">
              <span class="big">${lastPlayer ? glyph(lastPlayer) : "?"}</span>
              <strong>You</strong>
            </div>
            <div class="rps-vs">VS</div>
            <div class="rps-side">
              <span class="big">${lastCpu ? glyph(lastCpu) : "?"}</span>
              <strong>CPU</strong>
            </div>
          </div>
          <p class="status" aria-live="polite">${resultText}</p>
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
          ${
            matchOver
              ? `<div class="row">
                  <button class="btn btn-primary" type="button" data-new-match>Play again</button>
                </div>`
              : ""
          }
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
          announceUnlocks(checkRpsStreak(stats.streak));
        } else if (outcome === "lose") {
          stats.losses += 1;
          stats.streak = 0;
          match.cpu += 1;
          sfx.lose();
        } else {
          stats.draws += 1;
          sfx.draw();
        }

        if (match.you >= match.target) {
          matchOver = "you";
          burstAtElement(root.querySelector(".rps-arena"));
          pushHistory("RPS", "win");
          maybeCompleteDaily("rps", 1);
        }
        if (match.cpu >= match.target) {
          matchOver = "cpu";
          pushHistory("RPS", "loss");
        }

        saveJson(STATS_KEY, stats);
        paint();
      });
    });
  };

  paint();
}
