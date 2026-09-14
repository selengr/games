import { bindChrome, renderChrome } from "../../shared/chrome";
import { sfx, unlockAudio } from "../../shared/audio";
import { loadJson, saveJson } from "../../shared/storage";
import { checkTttWin, markPlayed } from "../../shared/achievements";
import { announceUnlocks } from "../../shared/toast";
import { burstAtElement } from "../../shared/fx";
import { shareText } from "../../shared/share";
import { pushHistory } from "../../shared/history";
import { getActiveDaily } from "../../shared/daily";
import { maybeCompleteDaily } from "../../shared/dailyComplete";
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
type Mode = "ai" | "friend";

const SCORE_KEY = "arcade-ttt-scores";

export function renderTicTacToe(root: HTMLElement): void {
  markPlayed("tictactoe");
  let board: Board = emptyBoard();
  let difficulty: Difficulty = "medium";
  let mode: Mode = "ai";
  let turn: "X" | "O" = "X";
  let locked = false;
  let scores = loadJson<Scores>(SCORE_KEY, { wins: 0, losses: 0, draws: 0 });

  const paint = (): void => {
    const winner = getWinner(board);
    const line = winningLine(board);
    const status =
      winner === "X"
        ? mode === "ai"
          ? "You win!"
          : "X wins!"
        : winner === "O"
          ? mode === "ai"
            ? "AI wins."
            : "O wins!"
          : winner === "draw"
            ? "Draw."
            : locked
              ? "AI is thinking…"
              : mode === "ai"
                ? "Your turn (X)"
                : `${turn}'s turn`;

    root.innerHTML = `
      <div class="shell route-fade">
        ${renderChrome({ showBack: true, helpGame: "tictactoe" })}
        <section class="panel">
          <h2>Tic-Tac-Toe</h2>
          <p class="muted">${
            mode === "ai"
              ? "You are X. Hard mode uses full minimax — it won't lose."
              : "Pass the device. X goes first."
          }</p>
          ${
            getActiveDaily()?.game === "tictactoe"
              ? `<div class="overlay-card"><strong>Daily challenge active</strong>Beat the AI to finish today's challenge.</div>`
              : ""
          }
          <div class="row" role="group" aria-label="Mode">
            <button class="btn btn-ghost ${mode === "ai" ? "btn-active" : ""}" type="button" data-mode="ai">vs AI</button>
            <button class="btn btn-ghost ${mode === "friend" ? "btn-active" : ""}" type="button" data-mode="friend">vs friend</button>
          </div>
          ${
            mode === "ai"
              ? `<div class="row" role="group" aria-label="Difficulty">
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
          </div>`
              : ""
          }
          <div class="scoreboard" aria-live="polite">
            <span class="score-pill">Wins ${scores.wins}</span>
            <span class="score-pill">Losses ${scores.losses}</span>
            <span class="score-pill">Draws ${scores.draws}</span>
          </div>
          <p class="status" aria-live="polite">${status}</p>
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
            ${
              winner
                ? `<button class="btn btn-ghost" type="button" data-share>Share result</button>`
                : ""
            }
          </div>
        </section>
      </div>
    `;

    bindChrome(root, paint, "tictactoe");

    root.querySelector("[data-reset]")?.addEventListener("click", () => {
      sfx.tap();
      board = emptyBoard();
      turn = "X";
      locked = false;
      paint();
    });

    root.querySelector("[data-share]")?.addEventListener("click", () => {
      void shareText(
        "Arcade Hub Tic-Tac-Toe",
        `Tic-Tac-Toe result: ${status} (${mode === "ai" ? `vs AI · ${difficulty}` : "vs friend"})`,
      );
    });

    root.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        sfx.tap();
        mode = btn.dataset.mode as Mode;
        board = emptyBoard();
        turn = "X";
        locked = false;
        paint();
      });
    });

    root.querySelectorAll<HTMLButtonElement>("[data-diff]").forEach((btn) => {
      btn.addEventListener("click", () => {
        sfx.tap();
        difficulty = btn.dataset.diff as Difficulty;
        board = emptyBoard();
        turn = "X";
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

  const recordAi = (result: "X" | "O" | "draw"): void => {
    if (result === "X") {
      scores.wins += 1;
      sfx.win();
      burstAtElement(root.querySelector(".ttt-board"));
      announceUnlocks(checkTttWin(difficulty === "hard"));
      pushHistory("Tic-Tac-Toe", `beat AI (${difficulty})`);
      maybeCompleteDaily("tictactoe", 1);
    } else if (result === "O") {
      scores.losses += 1;
      sfx.lose();
      pushHistory("Tic-Tac-Toe", `lost to AI (${difficulty})`);
    } else {
      scores.draws += 1;
      sfx.draw();
      pushHistory("Tic-Tac-Toe", `draw vs AI (${difficulty})`);
    }
    saveJson(SCORE_KEY, scores);
  };

  const playAt = (i: number): void => {
    if (locked || getWinner(board) || board[i] !== null) return;

    if (mode === "friend") {
      board[i] = turn;
      sfx.place();
      const result = getWinner(board);
      if (result === "X" || result === "O") {
        sfx.win();
        burstAtElement(root.querySelector(".ttt-board"));
      } else if (result === "draw") sfx.draw();
      else turn = turn === "X" ? "O" : "X";
      paint();
      return;
    }

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
      const move = aiPick(board, difficulty);
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
