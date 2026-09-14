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
  blurb: string;
  tone: string;
}> = [
  { route: "snake", title: "Snake", blurb: "Grow fast. Don't bite yourself.", tone: "tone-lime" },
  { route: "breakout", title: "Breakout", blurb: "Bounce the ball. Smash the wall.", tone: "tone-coral" },
  { route: "balloons", title: "Balloon Pop", blurb: "Tap pops. Streaks score bigger.", tone: "tone-teal" },
  { route: "tictactoe", title: "Tic-Tac-Toe", blurb: "Beat the AI or a friend.", tone: "tone-foam" },
  { route: "rps", title: "Rock Paper Scissors", blurb: "First to three wins.", tone: "tone-mist" },
  { route: "memory", title: "Memory", blurb: "Flip cards. Match the pairs.", tone: "tone-lime" },
];

const labels: Record<Exclude<Route, "hub">, string> = {
  snake: "Snake",
  breakout: "Breakout",
  balloons: "Balloon Pop",
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
      ${renderChrome({ showBack: false, showBrand: false })}
      <header class="hero">
        <h1>Arcade Hub</h1>
        <p>Six quick games. Pick one and play.</p>
        ${
          lastGame
            ? `<div class="row hero-actions">
                <button class="btn btn-ghost" type="button" data-continue>Continue</button>
              </div>`
            : ""
        }
      </header>

      <section class="panel daily-card" aria-label="Daily challenge">
        <span class="daily-status">${dailyDone ? "Done for today" : "Today's quest"}</span>
        <h2>${labels[daily.game]}</h2>
        <div class="row">
          <button class="btn ${dailyDone ? "btn-ghost" : "btn-primary"}" type="button" data-daily ${dailyDone ? "disabled" : ""}>
            ${dailyDone ? "Tomorrow" : "Play today's"}
          </button>
        </div>
      </section>

      <section class="game-grid" aria-label="Games">
        ${games
          .map(
            (game) => `
          <button class="game-card ${game.tone}" type="button" data-route="${game.route}">
            <h2>${game.title}</h2>
            <p>${game.blurb}</p>
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
