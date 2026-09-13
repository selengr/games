import { bindChrome, renderChrome } from "../../shared/chrome";
import { sfx, unlockAudio } from "../../shared/audio";
import { loadJson, saveJson } from "../../shared/storage";
import { allMatched, createDeck, type Card } from "./deck";
import "./memory.css";

type Best = { moves: number; seconds: number };

const BEST_KEY = "arcade-memory-best-v2";

function formatTime(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function renderMemory(root: HTMLElement): void {
  let cards: Card[] = createDeck();
  let flipped: number[] = [];
  let busy = false;
  let moves = 0;
  let seconds = 0;
  let started = false;
  let tick: number | null = null;
  let best = loadJson<Best | null>(BEST_KEY, null);

  const stopTimer = (): void => {
    if (tick !== null) {
      window.clearInterval(tick);
      tick = null;
    }
  };

  const startTimer = (): void => {
    if (started) return;
    started = true;
    tick = window.setInterval(() => {
      seconds += 1;
      const el = root.querySelector("[data-timer]");
      if (el) el.textContent = formatTime(seconds);
    }, 1000);
  };

  const paint = (): void => {
    const done = allMatched(cards);
    const status = done
      ? `Cleared in ${moves} moves · ${formatTime(seconds)}`
      : `Moves ${moves} · Time ${formatTime(seconds)}`;

    root.innerHTML = `
      <div class="shell">
        ${renderChrome({ showBack: true })}
        <section class="panel">
          <h2>Memory Match</h2>
          <p class="muted">Find all eight pairs. Timer starts on your first flip.</p>
          <div class="scoreboard">
            <span class="score-pill">Moves ${moves}</span>
            <span class="score-pill">Time <span data-timer>${formatTime(seconds)}</span></span>
            ${
              best
                ? `<span class="score-pill">Best ${best.moves} / ${formatTime(best.seconds)}</span>`
                : ""
            }
          </div>
          <p class="status">${status}</p>
          ${
            done
              ? `<div class="overlay-card"><strong>Nice clear!</strong>Shuffle again to beat your best.</div>`
              : ""
          }
          <div class="memory-grid" role="grid" aria-label="Memory cards">
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
            <button class="btn btn-primary" type="button" data-reset>Shuffle again</button>
          </div>
        </section>
      </div>
    `;

    bindChrome(root, paint);

    root.querySelector("[data-reset]")?.addEventListener("click", () => {
      sfx.tap();
      stopTimer();
      cards = createDeck();
      flipped = [];
      busy = false;
      moves = 0;
      seconds = 0;
      started = false;
      paint();
    });

    root.querySelectorAll<HTMLButtonElement>("[data-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (busy || done) return;
        const index = Number(btn.dataset.index);
        const card = cards[index];
        if (!card || card.matched || flipped.includes(index)) return;

        unlockAudio();
        startTimer();
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
            stopTimer();
            sfx.win();
            if (
              !best ||
              moves < best.moves ||
              (moves === best.moves && seconds < best.seconds)
            ) {
              best = { moves, seconds };
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

  const host = root as HTMLElement & { __memoryCleanup?: () => void };
  host.__memoryCleanup?.();
  host.__memoryCleanup = stopTimer;

  paint();
}
