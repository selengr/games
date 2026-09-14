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
import { ACHIEVEMENTS, unlockedIds } from "../shared/achievements";

const games: Array<{
  route: Exclude<Route, "hub">;
  title: string;
  blurb: string;
  tone: string;
}> = [
  { route: "snake", title: "Snake", blurb: "Grow fast. Don't bite yourself.", tone: "tone-lime" },
  { route: "breakout", title: "Breakout", blurb: "Bounce the ball. Smash the wall.", tone: "tone-coral" },
  { route: "balloons", title: "Balloon Pop", blurb: "Tap pops. Streaks score bigger.", tone: "tone-teal" },
  { route: "mole", title: "Whack-a-Mole", blurb: "Hit moles before they hide.", tone: "tone-gold" },
  { route: "reaction", title: "Reaction Duel", blurb: "Wait for GO. Beat the rival.", tone: "tone-coral" },
  { route: "tictactoe", title: "Tic-Tac-Toe", blurb: "Beat the AI or a friend.", tone: "tone-foam" },
  { route: "rps", title: "Rock Paper Scissors", blurb: "First to three wins.", tone: "tone-mist" },
  { route: "memory", title: "Memory", blurb: "Flip cards. Match the pairs.", tone: "tone-lime" },
];

const labels: Record<Exclude<Route, "hub">, string> = {
  snake: "Snake",
  breakout: "Breakout",
  balloons: "Balloon Pop",
  mole: "Whack-a-Mole",
  reaction: "Reaction Duel",
  tictactoe: "Tic-Tac-Toe",
  rps: "Rock Paper Scissors",
  memory: "Memory",
};

function badgesStripHtml(): string {
  const unlocked = new Set(unlockedIds());
  const count = unlocked.size;
  const total = ACHIEVEMENTS.length;
  const ordered = [
    ...ACHIEVEMENTS.filter((a) => unlocked.has(a.id)),
    ...ACHIEVEMENTS.filter((a) => !unlocked.has(a.id)),
  ];

  return `
    <section class="panel badge-strip" aria-label="Badges">
      <div class="badge-strip-head">
        <h2>Badges</h2>
        <span class="count">${count}/${total}</span>
      </div>
      ${
        count === 0
          ? `<p class="badge-empty">Play to unlock badges — they show up here.</p>`
          : ""
      }
      <div class="badge-rail">
        ${ordered
          .map(
            (a) => `
          <div class="badge-chip ${unlocked.has(a.id) ? "on" : ""}" title="${a.detail}">
            <strong>${a.title}</strong>
            <span>${a.detail}</span>
          </div>`,
          )
          .join("")}
      </div>
    </section>
  `;
}

export function renderHub(root: HTMLElement): void {
  const lastGame = getSettings().lastGame;
  const daily = getDailyChallenge();
  const dailyDone = isDailyDone();
  const recent = getHistory().slice(0, 5);

  root.innerHTML = `
    <div class="shell route-fade">
      ${renderChrome({ showBack: false, showBrand: false })}
      <header class="hero">
        <h1>Arcade Hub</h1>
        <p>Eight quick games. Pick one and play.</p>
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
        <p class="hint">${daily.detail}</p>
        <div class="row">
          <button class="btn ${dailyDone ? "btn-ghost" : "btn-primary"}" type="button" data-daily ${dailyDone ? "disabled" : ""}>
            ${dailyDone ? "Tomorrow" : "Play today's"}
          </button>
        </div>
      </section>

      ${badgesStripHtml()}

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

      ${
        recent.length
          ? `<section class="panel recent-plays" aria-label="Recent plays">
              <h2>Recent plays</h2>
              <ul class="history-list">
                ${recent
                  .map(
                    (entry) => `
                  <li>
                    <span><strong>${entry.game}</strong> · ${entry.summary}</span>
                    <span class="when">${formatWhen(entry.at)}</span>
                  </li>`,
                  )
                  .join("")}
              </ul>
            </section>`
          : ""
      }
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
