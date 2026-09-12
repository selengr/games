import { setRoute } from "../../shared/router";
import { loadJson, saveJson } from "../../shared/storage";
import { allMatched, createDeck, type Card } from "./deck";
import "./memory.css";

const BEST_KEY = "arcade-memory-best";

export function renderMemory(root: HTMLElement): void {
  let cards: Card[] = createDeck();
  let flipped: number[] = [];
  let busy = false;
  let moves = 0;
  let best = loadJson<number | null>(BEST_KEY, null);

  const paint = (): void => {
    const done = allMatched(cards);
    const status = done
      ? `Cleared in ${moves} moves${best !== null ? ` · best ${best}` : ""}`
      : `Moves: ${moves}${best !== null ? ` · best ${best}` : ""}`;

    root.innerHTML = `
      <div class="shell">
        <div class="brand-bar">
          <p class="brand">Arcade Hub</p>
          <button class="back-btn" type="button" data-back>← All games</button>
        </div>
        <section class="panel">
          <h2>Memory Match</h2>
          <p class="muted">Find all eight pairs. Fewer moves is better.</p>
          <p class="status">${status}</p>
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
                    ${card.matched || busy ? "disabled" : ""}
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

    root.querySelector("[data-back]")?.addEventListener("click", () => setRoute("hub"));
    root.querySelector("[data-reset]")?.addEventListener("click", () => {
      cards = createDeck();
      flipped = [];
      busy = false;
      moves = 0;
      paint();
    });

    root.querySelectorAll<HTMLButtonElement>("[data-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (busy) return;
        const index = Number(btn.dataset.index);
        const card = cards[index];
        if (!card || card.matched || flipped.includes(index)) return;

        flipped.push(index);
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
          if (allMatched(cards)) {
            if (best === null || moves < best) {
              best = moves;
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
