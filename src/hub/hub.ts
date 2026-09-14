import { setRoute, type Route } from "../shared/router";
import { bindChrome, renderChrome } from "../shared/chrome";
import { unlockAudio, sfx } from "../shared/audio";
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

export function renderHub(root: HTMLElement): void {
  const stats = collectStats();

  root.innerHTML = `
    <div class="shell route-fade">
      ${renderChrome({ showBack: false })}
      <header class="hero">
        <h1>Arcade Hub</h1>
        <p>Four browser games with sound, modes, badges, and local scores.</p>
      </header>
      ${renderStatsBlock(stats)}
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
    </div>
  `;

  bindChrome(root, () => renderHub(root));

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
