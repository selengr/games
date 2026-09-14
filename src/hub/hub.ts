import { setRoute, type Route } from "../shared/router";
import { bindChrome, renderChrome } from "../shared/chrome";
import { unlockAudio, sfx } from "../shared/audio";
import { getSettings } from "../shared/settings";
import {
  getDailyChallenge,
  isDailyDone,
  startDailyRun,
} from "../shared/daily";
import { formatWhen, getHistory } from "../shared/history";
import {
  clearAllProgress,
  collectStats,
  renderStatsBlock,
} from "../shared/stats";

const games: Array<{
  route: Exclude<Route, "hub">;
  tag: string;
  title: string;
  blurb: string;
}> = [
  {
    route: "snake",
    tag: "Arcade",
    title: "Snake",
    blurb: "Speed modes, wrap walls, pause, swipe, and a saved high score.",
  },
  {
    route: "tictactoe",
    tag: "Strategy",
    title: "Tic-Tac-Toe",
    blurb: "Minimax AI or pass-and-play with a friend. Scores stick around.",
  },
  {
    route: "rps",
    tag: "Reflex",
    title: "Rock Paper Scissors",
    blurb: "First to three. Track streaks and career wins.",
  },
  {
    route: "memory",
    tag: "Focus",
    title: "Memory Match",
    blurb: "Small, normal, or large boards with timer and best runs.",
  },
];

const labels: Record<Exclude<Route, "hub">, string> = {
  snake: "Snake",
  tictactoe: "Tic-Tac-Toe",
  rps: "Rock Paper Scissors",
  memory: "Memory Match",
};

export function renderHub(root: HTMLElement): void {
  const stats = collectStats();
  const lastGame = getSettings().lastGame;
  const daily = getDailyChallenge();
  const dailyDone = isDailyDone();
  const history = getHistory();

  root.innerHTML = `
    <div class="shell route-fade">
      ${renderChrome({ showBack: false })}
      <header class="hero">
        <h1>Arcade Hub</h1>
        <p>Four browser games with sound, modes, badges, and local scores.</p>
        ${
          lastGame
            ? `<div class="row" style="margin-top:1rem">
                <button class="btn btn-primary" type="button" data-continue>Continue ${labels[lastGame]}</button>
              </div>`
            : ""
        }
      </header>

      <section class="panel daily-card" aria-label="Daily challenge">
        <span class="daily-status">${dailyDone ? "Completed today" : "Today's challenge"}</span>
        <h2>${daily.title}</h2>
        <p class="muted">${daily.detail}</p>
        <div class="row">
          <button class="btn ${dailyDone ? "btn-ghost" : "btn-primary"}" type="button" data-daily ${dailyDone ? "disabled" : ""}>
            ${dailyDone ? "Come back tomorrow" : `Play ${labels[daily.game]}`}
          </button>
        </div>
      </section>

      ${renderStatsBlock(stats)}

      ${
        history.length
          ? `<section class="panel stats-panel" aria-label="Recent plays">
              <h2>Recent plays</h2>
              <p class="muted">Last sessions on this device.</p>
              <ul class="history-list">
                ${history
                  .map(
                    (h) => `
                  <li>
                    <span><strong>${h.game}</strong> · ${h.summary}</span>
                    <span class="when">${formatWhen(h.at)}</span>
                  </li>
                `,
                  )
                  .join("")}
              </ul>
            </section>`
          : ""
      }

      <section class="game-grid" aria-label="Games">
        ${games
          .map(
            (game) => `
          <button class="game-card" type="button" data-route="${game.route}">
            <span class="tag">${game.tag}</span>
            <h2>${game.title}</h2>
            <p>${game.blurb}</p>
          </button>
        `,
          )
          .join("")}
      </section>
      <p class="hub-footer">Tip: open Help inside a game. Snake likes arrow keys or <kbd>WASD</kbd>.</p>
      <p class="install-tip">On phone: use browser Share / Add to Home Screen for an app-like shortcut.</p>
    </div>
  `;

  bindChrome(root, () => renderHub(root));

  root.querySelector("[data-continue]")?.addEventListener("click", () => {
    if (!lastGame) return;
    unlockAudio();
    sfx.tap();
    setRoute(lastGame);
  });

  root.querySelector("[data-daily]")?.addEventListener("click", () => {
    if (dailyDone) return;
    unlockAudio();
    sfx.tap();
    startDailyRun();
    setRoute(daily.game);
  });

  root.querySelector("[data-reset-all]")?.addEventListener("click", () => {
    if (!window.confirm("Reset all scores and badges on this device?")) return;
    sfx.tap();
    clearAllProgress();
    renderHub(root);
  });

  root.querySelectorAll<HTMLButtonElement>("[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      unlockAudio();
      sfx.tap();
      const route = btn.dataset.route as Exclude<Route, "hub">;
      setRoute(route);
    });
  });
}
