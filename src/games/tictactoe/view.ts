import { bindChrome, renderChrome } from "../../shared/chrome";
import { sfx, unlockAudio } from "../../shared/audio";
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
} from "./engine";
import "./tictactoe.css";

type Scores = { wins: number; losses: number; draws: number };

const SCORE_KEY = "arcade-ttt-scores";

export function renderTicTacToe(root: HTMLElement): void {
  markPlayed("tictactoe");
  let board: Board = emptyBoard();
  let locked = false;
  let scores = loadJson<Scores>(SCORE_KEY, { wins: 0, losses: 0, draws: 0 });

  const paint = (): void => {
    const winner = getWinner(board);
    const line = winningLine(board);
    const status =
      winner === "X"
        ? "You win!"
        : winner === "O"
          ? "You lose"
          : winner === "draw"
            ? "Draw"
            : locked
              ? "Thinking…"
              : "Your turn";

    root.innerHTML = `
      <div class="shell route-fade">
        ${renderChrome({ showBack: true })}
        <section class="panel">
          <h2>Tic-Tac-Toe</h2>
          <div class="scoreboard" aria-live="polite">
            <span class="score-pill">Wins ${scores.wins}</span>
            <span class="score-pill">Losses ${scores.losses}</span>
          </div>
          <p class="status" aria-live="polite">${status}</p>
          <div class="ttt-board" role="grid" aria-label="Board">
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
                    aria-label="Cell ${i + 1}"
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

    bindChrome(root, paint);

    root.querySelector("[data-reset]")?.addEventListener("click", () => {
      sfx.tap();
      board = emptyBoard();
      locked = false;
      paint();
    });

    root.querySelectorAll<HTMLButtonElement>("[data-cell]").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        playAt(Number(btn.dataset.cell));
      });
    });
  };

  const recordAi = (result: "X" | "O" | "draw"): void => {
    if (result === "X") {
      scores.wins += 1;
      sfx.win();
      burstAtElement(root.querySelector(".ttt-board"));
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
    sfx.place();
    const afterHuman = getWinner(board);
    if (afterHuman) {
      recordAi(afterHuman);
      paint();
      return;
    }

    locked = true;
    paint();

    window.setTimeout(() => {
      const move = aiPick(board, "medium");
      if (board[move] === null) board[move] = "O";
      sfx.place();
      const afterAi = getWinner(board);
      if (afterAi) recordAi(afterAi);
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
