import { describe, expect, it } from "vitest";
import { emptyBoard, getWinner, aiPick, winningLine } from "./engine";

describe("tic-tac-toe engine", () => {
  it("starts empty", () => {
    expect(emptyBoard().every((c) => c === null)).toBe(true);
  });

  it("detects a row win", () => {
    const board = emptyBoard();
    board[0] = "X";
    board[1] = "X";
    board[2] = "X";
    expect(getWinner(board)).toBe("X");
    expect(winningLine(board)).toEqual([0, 1, 2]);
  });

  it("detects a draw", () => {
    const board = ["X", "O", "X", "X", "O", "O", "O", "X", "X"] as const;
    expect(getWinner([...board])).toBe("draw");
  });

  it("hard ai blocks an obvious threat", () => {
    const board = emptyBoard();
    board[0] = "X";
    board[1] = "X";
    // O should take 2 to block
    const move = aiPick(board, "hard", "O", "X");
    expect(move).toBe(2);
  });
});
