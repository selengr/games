import { bindChrome, renderChrome } from "../../shared/chrome";
import { sfx, unlockAudio } from "../../shared/audio";
import { loadJson, saveJson } from "../../shared/storage";
import { checkMemoryClear, markPlayed } from "../../shared/achievements";
import { announceUnlocks } from "../../shared/toast";
import { burstAtElement } from "../../shared/fx";
import { pushHistory } from "../../shared/history";
import { maybeCompleteDaily } from "../../shared/dailyComplete";
import {
  allMatched,
  columnsFor,
  createDeck,
  type Card,
} from "./deck";
import "./memory.css";

type Best = { moves: number; seconds: number };

const BEST_KEY = "arcade-memory-best-normal";

export function renderMemory(root: HTMLElement): void {
  markPlayed("memory");
  let cards: Card[] = createDeck("normal");
  let flipped: number[] = [];
  let busy = false;
  let moves = 0;
  let best = loadJson<Best | null>(BEST_KEY, null);

  const freshBoard = (): void => {
    cards = createDeck("normal");
    flipped = [];
    busy = false;
    moves = 0;
    best = loadJson<Best | null>(BEST_KEY, null);
  };

  const paint = (): void => {
    const done = allMatched(cards);
    const cols = columnsFor("normal");
    const status = done ? "You did it!" : "Find the pairs";

    root.innerHTML = `
      <div class="shell route-fade">
        ${renderChrome({ showBack: true })}
        <section class="panel">
          <h2>Memory</h2>
          <div class="scoreboard">
            <span class="score-pill">Moves ${moves}</span>
            ${
              best
                ? `<span class="score-pill">Best ${best.moves}</span>`
                : ""
            }
          </div>
          <p class="status" aria-live="polite">${status}</p>
          <div class="memory-grid cols-${cols}" role="grid" aria-label="Cards">
            ${cards
              .map((card, index) => {
                const show =
                  card.matched || flipped.includes(index) ? "flipped" : "";
                const matched = card.matched ? "matched" : "";
                return `
                  <button
                    class="memory-card ${show} ${matched}"
                    type="button"
                    data-index="${index}"
                    aria-label="${
                      card.matched || flipped.includes(index)
                        ? `Card ${card.symbol}`
                        : "Hidden card"
                    }"
                    ${card.matched || busy || done ? "disabled" : ""}
                  >${card.matched || flipped.includes(index) ? card.symbol : ""}</button>
                `;
              })
              .join("")}
          </div>
          <div class="row">
            <button class="btn btn-primary" type="button" data-reset>New game</button>
          </div>
        </section>
      </div>
    `;

    bindChrome(root, paint);

    root.querySelector("[data-reset]")?.addEventListener("click", () => {
      sfx.tap();
      freshBoard();
      paint();
    });

    root.querySelectorAll<HTMLButtonElement>("[data-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (busy || done) return;
        const index = Number(btn.dataset.index);
        const card = cards[index];
        if (!card || card.matched || flipped.includes(index)) return;

        unlockAudio();
        flipped.push(index);
        sfx.flip();
        paint();

        if (flipped.length < 2) return;

        moves += 1;
        const [a, b] = flipped;
        const first = cards[a!];
        const second = cards[b!];
        if (!first || !second) return;

        if (first.symbol === second.symbol) {
          first.matched = true;
          second.matched = true;
          flipped = [];
          sfx.match();
          if (allMatched(cards)) {
            sfx.win();
            burstAtElement(root.querySelector(".memory-grid"));
            announceUnlocks(checkMemoryClear(false));
            pushHistory("Memory", `cleared in ${moves} moves`);
            maybeCompleteDaily("memory", moves);
            if (!best || moves < best.moves) {
              best = { moves, seconds: 0 };
              saveJson(BEST_KEY, best);
            }
          }
          paint();
          return;
        }

        busy = true;
        paint();
        window.setTimeout(() => {
          flipped = [];
          busy = false;
          paint();
        }, 650);
      });
    });
  };

  paint();
}
