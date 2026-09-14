import { setRoute, type Route } from "../shared/router";
import { bindChrome, renderChrome } from "../shared/chrome";
import { unlockAudio, sfx } from "../shared/audio";
import { getSettings } from "../shared/settings";
import {
  getDailyChallenge,
  isDailyDone,
  startDailyRun,
} from "../shared/daily";

const games: Array<{
  route: Exclude<Route, "hub">;
  title: string;
}> = [
  { route: "snake", title: "Snake" },
  { route: "tictactoe", title: "Tic-Tac-Toe" },
  { route: "rps", title: "Rock Paper Scissors" },
  { route: "memory", title: "Memory" },
];

const labels: Record<Exclude<Route, "hub">, string> = {
  snake: "Snake",
  tictactoe: "Tic-Tac-Toe",
  rps: "Rock Paper Scissors",
  memory: "Memory",
};

export function renderHub(root: HTMLElement): void {
  const lastGame = getSettings().lastGame;
  const daily = getDailyChallenge();
  const dailyDone = isDailyDone();

  root.innerHTML = `
    <div class="shell route-fade">
      ${renderChrome({ showBack: false })}
      <header class="hero">
        <h1>Arcade Hub</h1>
        <p>Pick a game!</p>
        ${
          lastGame
            ? `<div class="row" style="margin-top:1rem">
                <button class="btn btn-primary" type="button" data-continue>Keep playing ${labels[lastGame]}</button>
              </div>`
            : ""
        }
      </header>

      <section class="panel daily-card" aria-label="Daily challenge">
        <span class="daily-status">${dailyDone ? "Done for today" : "Today"}</span>
        <h2>${daily.title}</h2>
        <div class="row">
          <button class="btn ${dailyDone ? "btn-ghost" : "btn-primary"}" type="button" data-daily ${dailyDone ? "disabled" : ""}>
            ${dailyDone ? "See you tomorrow" : "Play"}
          </button>
        </div>
      </section>

      <section class="game-grid" aria-label="Games">
        ${games
          .map(
            (game) => `
          <button class="game-card" type="button" data-route="${game.route}">
            <h2>${game.title}</h2>
          </button>
        `,
          )
          .join("")}
      </section>
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

  root.querySelectorAll<HTMLButtonElement>("[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      unlockAudio();
      sfx.tap();
      const route = btn.dataset.route as Exclude<Route, "hub">;
      setRoute(route);
    });
  });
}
