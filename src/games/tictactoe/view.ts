import { setRoute } from "../../shared/router";
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
        <div class="brand-bar">
          <p class="brand">Arcade Hub</p>
          <button class="back-btn" type="button" data-back>← All games</button>
        </div>
        <section class="panel">
          <h2>Tic-Tac-Toe</h2>
          <p class="muted">You are X. AI uses minimax on hard — it will not lose.</p>
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
          <div class="row" style="margin-top: 1rem">
            <button class="btn btn-primary" type="button" data-reset>New game</button>
          </div>
        </section>
      </div>
    `;

    root.querySelector("[data-back]")?.addEventListener("click", () => setRoute("hub"));
    root.querySelector("[data-reset]")?.addEventListener("click", () => {
      board = emptyBoard();
      locked = false;
      paint();
    });

    root.querySelectorAll<HTMLButtonElement>("[data-diff]").forEach((btn) => {
      btn.addEventListener("click", () => {
        difficulty = btn.dataset.diff as Difficulty;
        board = emptyBoard();
        locked = false;
        paint();
      });
    });

    root.querySelectorAll<HTMLButtonElement>("[data-cell]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (locked || getWinner(board)) return;
        const i = Number(btn.dataset.cell);
        if (board[i]) return;

        board[i] = "X";
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
          const afterAi = getWinner(board);
          if (afterAi) record(afterAi);
          locked = false;
          paint();
        }, 320);
      });
    });
  };

  const record = (result: "X" | "O" | "draw"): void => {
    if (result === "X") scores.wins += 1;
    else if (result === "O") scores.losses += 1;
    else scores.draws += 1;
    saveJson(SCORE_KEY, scores);
  };

  paint();
}
