import { setRoute, type Route } from "../shared/router";

const games: Array<{
  route: Exclude<Route, "hub">;
  tag: string;
  title: string;
  blurb: string;
}> = [
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
    blurb: "Best-of vibes with streak tracking. Can you outguess the machine?",
  },
  {
    route: "memory",
    tag: "Focus",
    title: "Memory Match",
    blurb: "Flip cards, find pairs, beat your best move count.",
  },
];

export function renderHub(root: HTMLElement): void {
  root.innerHTML = `
    <div class="shell">
      <header class="hero">
        <h1>Arcade Hub</h1>
        <p>Three original browser games in TypeScript — pick one and play.</p>
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
    </div>
  `;

  root.querySelectorAll<HTMLButtonElement>("[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const route = btn.dataset.route as Exclude<Route, "hub">;
      setRoute(route);
    });
  });
}
