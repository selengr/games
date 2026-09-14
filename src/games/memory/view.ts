import { bindChrome, renderChrome } from "../../shared/chrome";
import { sfx, unlockAudio } from "../../shared/audio";
import { isMuted } from "../../shared/settings";
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
const CARD_COUNT = 16;

function refreshMute(root: HTMLElement): void {
  const muted = isMuted();
  const btn = root.querySelector<HTMLButtonElement>("[data-mute]");
  if (!btn) return;
  btn.setAttribute("aria-pressed", String(muted));
  btn.textContent = muted ? "Sound off" : "Sound";
}

export function renderMemory(root: HTMLElement): void {
  markPlayed("memory");
  let cards: Card[] = createDeck("normal");
  let flipped: number[] = [];
  let busy = false;
  let moves = 0;
  let best = loadJson<Best | null>(BEST_KEY, null);
  let lastFlip: number | null = null;

  const cols = columnsFor("normal");

  root.innerHTML = `
    <div class="shell route-fade">
      ${renderChrome({ showBack: true })}
      <section class="panel">
        <h2>Memory</h2>
        <div class="scoreboard">
          <span class="score-pill" data-moves>Moves 0</span>
          <span class="score-pill" data-best ${best ? "" : "hidden"}>Best ${best?.moves ?? ""}</span>
        </div>
        <p class="status" data-status aria-live="polite">Find the pairs</p>
        <div class="memory-grid cols-${cols}" role="grid" aria-label="Cards">
          ${Array.from({ length: CARD_COUNT }, (_, index) => `
            <button
              class="memory-card"
              type="button"
              data-index="${index}"
              aria-label="Hidden card"
            ></button>
          `).join("")}
        </div>
        <div class="row">
          <button class="btn btn-primary" type="button" data-reset>New game</button>
        </div>
      </section>
    </div>
  `;

  bindChrome(root, () => refreshMute(root));

  const gridEl = root.querySelector(".memory-grid");
  const statusEl = root.querySelector<HTMLElement>("[data-status]");
  const movesEl = root.querySelector<HTMLElement>("[data-moves]");
  const bestEl = root.querySelector<HTMLElement>("[data-best]");

  const freshBoard = (): void => {
    cards = createDeck("normal");
    flipped = [];
    busy = false;
    moves = 0;
    lastFlip = null;
    best = loadJson<Best | null>(BEST_KEY, null);
  };

  const sync = (): void => {
    const done = allMatched(cards);

    root.querySelectorAll<HTMLButtonElement>("[data-index]").forEach((btn) => {
      const index = Number(btn.dataset.index);
      const card = cards[index];
      if (!card) return;

      const open = card.matched || flipped.includes(index);
      const prevOpen = btn.classList.contains("flipped") || btn.classList.contains("matched");

      btn.textContent = open ? card.symbol : "";
      btn.className = [
        "memory-card",
        open && !card.matched ? "flipped" : "",
        card.matched ? "matched" : "",
        lastFlip === index && open && !prevOpen ? "pop" : "",
      ]
        .filter(Boolean)
        .join(" ");

      if (lastFlip === index && open && !prevOpen) {
        btn.classList.remove("pop");
        void btn.offsetWidth;
        btn.classList.add("pop");
      }

      btn.disabled = card.matched || busy || done || flipped.includes(index);
      btn.setAttribute(
        "aria-label",
        open ? `Card ${card.symbol}` : "Hidden card",
      );
    });

    if (statusEl) statusEl.textContent = done ? "You did it!" : "Find the pairs";
    if (movesEl) movesEl.textContent = `Moves ${moves}`;
    if (bestEl) {
      if (best) {
        bestEl.hidden = false;
        bestEl.textContent = `Best ${best.moves}`;
      } else {
        bestEl.hidden = true;
      }
    }
  };

  const onCard = (index: number): void => {
    const done = allMatched(cards);
    if (busy || done) return;
    const card = cards[index];
    if (!card || card.matched || flipped.includes(index)) return;

    unlockAudio();
    flipped.push(index);
    lastFlip = index;
    sfx.flip();
    sync();

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
        burstAtElement(gridEl);
        announceUnlocks(checkMemoryClear(false));
        pushHistory("Memory", `cleared in ${moves} moves`);
        maybeCompleteDaily("memory", moves);
        if (!best || moves < best.moves) {
          best = { moves, seconds: 0 };
          saveJson(BEST_KEY, best);
        }
      }
      sync();
      return;
    }

    busy = true;
    sync();
    window.setTimeout(() => {
      flipped = [];
      busy = false;
      lastFlip = null;
      sync();
    }, 650);
  };

  gridEl?.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-index]");
    if (!target || target.disabled) return;
    onCard(Number(target.dataset.index));
  });

  root.querySelector("[data-reset]")?.addEventListener("click", () => {
    sfx.tap();
    freshBoard();
    sync();
  });

  sync();
}
