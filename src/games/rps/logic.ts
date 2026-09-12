export type Move = "rock" | "paper" | "scissors";
export type Outcome = "win" | "lose" | "draw";

export const MOVES: Move[] = ["rock", "paper", "scissors"];

export function label(move: Move): string {
  if (move === "rock") return "Rock";
  if (move === "paper") return "Paper";
  return "Scissors";
}

export function glyph(move: Move): string {
  if (move === "rock") return "R";
  if (move === "paper") return "P";
  return "S";
}

export function randomMove(): Move {
  return MOVES[Math.floor(Math.random() * MOVES.length)]!;
}

export function decide(player: Move, cpu: Move): Outcome {
  if (player === cpu) return "draw";
  if (
    (player === "rock" && cpu === "scissors") ||
    (player === "paper" && cpu === "rock") ||
    (player === "scissors" && cpu === "paper")
  ) {
    return "win";
  }
  return "lose";
}
