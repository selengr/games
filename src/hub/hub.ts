import { setRoute, type Route } from "../shared/router";
import { bindChrome, renderChrome } from "../shared/chrome";
import { unlockAudio, sfx } from "../shared/audio";

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
    blurb: "Classic grid snake with high score, pause, and touch controls.",
  },
  {
    route: "tictactoe",
    tag: "Strategy",
    title: "Tic-Tac-Toe",
    blurb: "Play vs minimax AI with easy / medium / hard difficulty and persistent scores.",
  },
  {
    route: "rps",
    tag: "Reflex",
    title: "Rock Paper Scissors",
    blurb: "Best-of-five rounds with streak tracking. Outguess the machine.",
  },
  {
    route: "memory",
    tag: "Focus",
    title: "Memory Match",
    blurb: "Flip cards, find pairs, beat your best time and move count.",
  },
];

export function renderHub(root: HTMLElement): void {
  root.innerHTML = `
    <div class="shell">
      ${renderChrome({ showBack: false })}
      <header class="hero">
        <h1>Arcade Hub</h1>
        <p>Four browser games. Sound, scores, and a real snake loop — pick one.</p>
      </header>
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
      <p class="hub-footer">Tip: unmute from the top bar. Snake likes arrow keys or <kbd>WASD</kbd>.</p>
    </div>
  `;

  bindChrome(root, () => renderHub(root));

  root.querySelectorAll<HTMLButtonElement>("[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      unlockAudio();
      sfx.tap();
      const route = btn.dataset.route as Exclude<Route, "hub">;
      setRoute(route);
    });
  });
}
