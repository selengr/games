import { bindChrome, renderChrome } from "../../shared/chrome";
import { sfx, unlockAudio } from "../../shared/audio";
import { isMuted } from "../../shared/settings";
import { loadJson, saveJson } from "../../shared/storage";
import { checkTttWin, markPlayed } from "../../shared/achievements";
import { announceUnlocks } from "../../shared/toast";
import { burstAtElement } from "../../shared/fx";
import { pushHistory } from "../../shared/history";
import { maybeCompleteDaily } from "../../shared/dailyComplete";
import {
  aiPick,
  emptyBoard,
  getWinner,
  winningLine,
  type Board,
  type Cell,
} from "./engine";
import "./tictactoe.css";

type Scores = { wins: number; losses: number; draws: number };

const SCORE_KEY = "arcade-ttt-scores";

function statusText(
  board: Board,
  locked: boolean,
): string {
  const winner = getWinner(board);
  if (winner === "X") return "You win!";
  if (winner === "O") return "You lose";
  if (winner === "draw") return "Draw";
  if (locked) return "Thinking…";
  return "Your turn";
}

function refreshMute(root: HTMLElement): void {
  const muted = isMuted();
  const btn = root.querySelector<HTMLButtonElement>("[data-mute]");
  if (!btn) return;
  btn.setAttribute("aria-pressed", String(muted));
  btn.textContent = muted ? "Sound off" : "Sound";
}

export function renderTicTacToe(root: HTMLElement): void {
  markPlayed("tictactoe");
  let board: Board = emptyBoard();
  let locked = false;
  let scores = loadJson<Scores>(SCORE_KEY, { wins: 0, losses: 0, draws: 0 });
  let lastPlaced: number | null = null;

  root.innerHTML = `
    <div class="shell route-fade">
      ${renderChrome({ showBack: true })}
      <section class="panel ttt-panel">
        <h2>Tic-Tac-Toe</h2>
        <div class="scoreboard" aria-live="polite">
          <span class="score-pill" data-wins>Wins ${scores.wins}</span>
          <span class="score-pill" data-losses>Losses ${scores.losses}</span>
        </div>
        <p class="status" data-status aria-live="polite">Your turn</p>
        <div class="ttt-board" role="grid" aria-label="Board">
          ${Array.from({ length: 9 }, (_, i) => `
            <button
              class="ttt-cell"
              type="button"
              data-cell="${i}"
              aria-label="Cell ${i + 1}"
            ></button>
          `).join("")}
        </div>
        <div class="row ttt-actions">
          <button class="btn btn-primary" type="button" data-reset>New game</button>
        </div>
      </section>
    </div>
  `;

  bindChrome(root, () => refreshMute(root));

  const boardEl = root.querySelector(".ttt-board");
  const statusEl = root.querySelector<HTMLElement>("[data-status]");
  const winsEl = root.querySelector<HTMLElement>("[data-wins]");
  const lossesEl = root.querySelector<HTMLElement>("[data-losses]");

  const sync = (): void => {
    const winner = getWinner(board);
    const line = winningLine(board);

    root.querySelectorAll<HTMLButtonElement>("[data-cell]").forEach((btn) => {
      const i = Number(btn.dataset.cell);
      const cell = board[i] as Cell;
      const mark = cell ?? "";
      const wasEmpty = btn.textContent === "";
      btn.textContent = mark;
      btn.className = [
        "ttt-cell",
        cell === "X" ? "x" : "",
        cell === "O" ? "o" : "",
        line?.includes(i) ? "win" : "",
        lastPlaced === i ? "pop" : "",
      ]
        .filter(Boolean)
        .join(" ");
      btn.disabled = Boolean(cell) || Boolean(winner) || locked;
      if (mark && wasEmpty && lastPlaced === i) {
        // restart pop animation
        btn.classList.remove("pop");
        void btn.offsetWidth;
        btn.classList.add("pop");
      }
    });

    if (statusEl) statusEl.textContent = statusText(board, locked);
    if (winsEl) winsEl.textContent = `Wins ${scores.wins}`;
    if (lossesEl) lossesEl.textContent = `Losses ${scores.losses}`;
  };

  const recordAi = (result: "X" | "O" | "draw"): void => {
    if (result === "X") {
      scores.wins += 1;
      sfx.win();
      burstAtElement(boardEl);
      announceUnlocks(checkTttWin(false));
      pushHistory("Tic-Tac-Toe", "win");
      maybeCompleteDaily("tictactoe", 1);
    } else if (result === "O") {
      scores.losses += 1;
      sfx.lose();
      pushHistory("Tic-Tac-Toe", "loss");
    } else {
      scores.draws += 1;
      sfx.draw();
      pushHistory("Tic-Tac-Toe", "draw");
    }
    saveJson(SCORE_KEY, scores);
  };

  const playAt = (i: number): void => {
    if (locked || getWinner(board) || board[i] !== null) return;

    board[i] = "X";
    lastPlaced = i;
    sfx.place();
    const afterHuman = getWinner(board);
    if (afterHuman) {
      recordAi(afterHuman);
      sync();
      return;
    }

    locked = true;
    sync();

    window.setTimeout(() => {
      const move = aiPick(board, "medium");
      if (board[move] === null) {
        board[move] = "O";
        lastPlaced = move;
        sfx.place();
      }
      const afterAi = getWinner(board);
      if (afterAi) recordAi(afterAi);
      locked = false;
      sync();
    }, 280);
  };

  boardEl?.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-cell]");
    if (!target || target.disabled) return;
    unlockAudio();
    playAt(Number(target.dataset.cell));
  });

  root.querySelector("[data-reset]")?.addEventListener("click", () => {
    sfx.tap();
    board = emptyBoard();
    locked = false;
    lastPlaced = null;
    sync();
  });

  const onKey = (e: KeyboardEvent): void => {
    if (e.key < "1" || e.key > "9") return;
    playAt(Number(e.key) - 1);
  };

  window.addEventListener("keydown", onKey);
  const host = root as HTMLElement & { __tttCleanup?: () => void };
  host.__tttCleanup?.();
  host.__tttCleanup = () => window.removeEventListener("keydown", onKey);

  sync();
}
