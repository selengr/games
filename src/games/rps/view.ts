import { bindChrome, renderChrome } from "../../shared/chrome";
import { sfx, unlockAudio } from "../../shared/audio";
import { isMuted } from "../../shared/settings";
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

function refreshMute(root: HTMLElement): void {
  const muted = isMuted();
  const btn = root.querySelector<HTMLButtonElement>("[data-mute]");
  if (!btn) return;
  btn.setAttribute("aria-pressed", String(muted));
  btn.textContent = muted ? "Sound off" : "Sound";
}

function resultText(
  matchOver: "you" | "cpu" | null,
  lastOutcome: Outcome | null,
): string {
  if (matchOver === "you") return "You win!";
  if (matchOver === "cpu") return "You lose";
  if (lastOutcome === "win") return "Nice!";
  if (lastOutcome === "lose") return "Oops";
  if (lastOutcome === "draw") return "Tie";
  return "Pick one";
}

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

  root.innerHTML = `
    <div class="shell route-fade">
      ${renderChrome({ showBack: true })}
      <section class="panel">
        <h2>Rock Paper Scissors</h2>
        <div class="scoreboard">
          <span class="score-pill" data-score>0 – 0</span>
        </div>
        <div class="rps-arena" aria-live="polite">
          <div class="rps-side">
            <span class="big" data-you-glyph>?</span>
            <strong>You</strong>
          </div>
          <div class="rps-vs">VS</div>
          <div class="rps-side">
            <span class="big" data-cpu-glyph>?</span>
            <strong>CPU</strong>
          </div>
        </div>
        <p class="status" data-status aria-live="polite">Pick one</p>
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
        <div class="row" data-again-row hidden>
          <button class="btn btn-primary" type="button" data-new-match>Play again</button>
        </div>
      </section>
    </div>
  `;

  bindChrome(root, () => refreshMute(root));

  const scoreEl = root.querySelector<HTMLElement>("[data-score]");
  const statusEl = root.querySelector<HTMLElement>("[data-status]");
  const youGlyph = root.querySelector<HTMLElement>("[data-you-glyph]");
  const cpuGlyph = root.querySelector<HTMLElement>("[data-cpu-glyph]");
  const againRow = root.querySelector<HTMLElement>("[data-again-row]");
  const arena = root.querySelector(".rps-arena");

  const sync = (): void => {
    if (scoreEl) scoreEl.textContent = `${match.you} – ${match.cpu}`;
    if (statusEl) statusEl.textContent = resultText(matchOver, lastOutcome);
    if (youGlyph) {
      youGlyph.textContent = lastPlayer ? glyph(lastPlayer) : "?";
      youGlyph.classList.toggle("pop", Boolean(lastPlayer));
    }
    if (cpuGlyph) {
      cpuGlyph.textContent = lastCpu ? glyph(lastCpu) : "?";
      cpuGlyph.classList.toggle("pop", Boolean(lastCpu));
    }
    if (againRow) againRow.hidden = !matchOver;

    root.querySelectorAll<HTMLButtonElement>("[data-move]").forEach((btn) => {
      btn.disabled = Boolean(matchOver);
    });
  };

  const resetMatch = (): void => {
    match = { you: 0, cpu: 0, target: 3 };
    matchOver = null;
    lastPlayer = null;
    lastCpu = null;
    lastOutcome = null;
    sync();
  };

  root.querySelector("[data-new-match]")?.addEventListener("click", () => {
    sfx.tap();
    resetMatch();
  });

  root.querySelector(".rps-choices")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-move]");
    if (!btn || btn.disabled || matchOver) return;

    unlockAudio();
    const player = btn.dataset.move as Move;
    const cpu = randomMove();
    const outcome = decide(player, cpu);
    lastPlayer = player;
    lastCpu = cpu;
    lastOutcome = outcome;

    if (youGlyph) {
      youGlyph.classList.remove("pop");
      void youGlyph.offsetWidth;
    }
    if (cpuGlyph) {
      cpuGlyph.classList.remove("pop");
      void cpuGlyph.offsetWidth;
    }

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
      burstAtElement(arena);
      pushHistory("RPS", "win");
      maybeCompleteDaily("rps", 1);
    }
    if (match.cpu >= match.target) {
      matchOver = "cpu";
      pushHistory("RPS", "loss");
    }

    saveJson(STATS_KEY, stats);
    sync();
  });

  sync();
}
