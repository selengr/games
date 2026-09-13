import { bindChrome, renderChrome } from "../../shared/chrome";
import { sfx, unlockAudio } from "../../shared/audio";
import { loadJson, saveJson } from "../../shared/storage";
import {
  aiPick,
  emptyBoard,
  getWinner,
  winningLine,
  type Board,
  type Difficulty,
} from "./engine";
import "./tictactoe.css";

type Scores = { wins: number; losses: number; draws: number };

const SCORE_KEY = "arcade-ttt-scores";

export function renderTicTacToe(root: HTMLElement): void {
  let board: Board = emptyBoard();
  let difficulty: Difficulty = "medium";
  let locked = false;
  let scores = loadJson<Scores>(SCORE_KEY, { wins: 0, losses: 0, draws: 0 });

  const paint = (): void => {
    const winner = getWinner(board);
    const line = winningLine(board);
    const status =
      winner === "X"
        ? "You win!"
        : winner === "O"
          ? "AI wins."
          : winner === "draw"
            ? "Draw."
            : locked
              ? "AI is thinking…"
              : "Your turn (X)";

    root.innerHTML = `
      <div class="shell">
        ${renderChrome({ showBack: true })}
        <section class="panel">
          <h2>Tic-Tac-Toe</h2>
          <p class="muted">You are X. Hard mode uses full minimax — it won't lose.</p>
          <div class="row" role="group" aria-label="Difficulty">
            ${(["easy", "medium", "hard"] as Difficulty[])
              .map(
                (level) => `
              <button
                class="btn btn-ghost ${difficulty === level ? "btn-active" : ""}"
                type="button"
                data-diff="${level}"
              >${level}</button>
            `,
              )
              .join("")}
          </div>
          <div class="scoreboard" aria-live="polite">
            <span class="score-pill">Wins ${scores.wins}</span>
            <span class="score-pill">Losses ${scores.losses}</span>
            <span class="score-pill">Draws ${scores.draws}</span>
          </div>
          <p class="status">${status}</p>
          ${
            winner
              ? `<div class="overlay-card"><strong>${status}</strong>Hit New game for another round.</div>`
              : ""
          }
          <div class="ttt-board" role="grid" aria-label="Tic-tac-toe board">
            ${board
              .map((cell, i) => {
                const win = line?.includes(i) ?? false;
                const mark = cell ?? "";
                const cls = [
                  "ttt-cell",
                  cell === "X" ? "x" : "",
                  cell === "O" ? "o" : "",
                  win ? "win" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return `
                  <button
                    class="${cls}"
                    type="button"
                    data-cell="${i}"
                    aria-label="Cell ${i + 1}${mark ? `, ${mark}` : ""}"
                    ${cell || winner || locked ? "disabled" : ""}
                  >${mark}</button>
                `;
              })
              .join("")}
          </div>
          <p class="hint">Tip: keys 1–9 pick cells (top-left is 1).</p>
          <div class="row" style="margin-top: 1rem">
            <button class="btn btn-primary" type="button" data-reset>New game</button>
          </div>
        </section>
      </div>
    `;

    bindChrome(root, paint);

    root.querySelector("[data-reset]")?.addEventListener("click", () => {
      sfx.tap();
      board = emptyBoard();
      locked = false;
      paint();
    });

    root.querySelectorAll<HTMLButtonElement>("[data-diff]").forEach((btn) => {
      btn.addEventListener("click", () => {
        sfx.tap();
        difficulty = btn.dataset.diff as Difficulty;
        board = emptyBoard();
        locked = false;
        paint();
      });
    });

    root.querySelectorAll<HTMLButtonElement>("[data-cell]").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        playAt(Number(btn.dataset.cell));
      });
    });
  };

  const record = (result: "X" | "O" | "draw"): void => {
    if (result === "X") {
      scores.wins += 1;
      sfx.win();
    } else if (result === "O") {
      scores.losses += 1;
      sfx.lose();
    } else {
      scores.draws += 1;
      sfx.draw();
    }
    saveJson(SCORE_KEY, scores);
  };

  const playAt = (i: number): void => {
    if (locked || getWinner(board) || board[i] !== null) return;

    board[i] = "X";
    sfx.place();
    const afterHuman = getWinner(board);
    if (afterHuman) {
      record(afterHuman);
      paint();
      return;
    }

    locked = true;
    paint();

    window.setTimeout(() => {
      const move = aiPick(board, difficulty);
      if (board[move] === null) board[move] = "O";
      sfx.place();
      const afterAi = getWinner(board);
      if (afterAi) record(afterAi);
      locked = false;
      paint();
    }, 320);
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.key < "1" || e.key > "9") return;
    playAt(Number(e.key) - 1);
  };

  window.addEventListener("keydown", onKey);
  const host = root as HTMLElement & { __tttCleanup?: () => void };
  host.__tttCleanup?.();
  host.__tttCleanup = () => window.removeEventListener("keydown", onKey);

  paint();
}
