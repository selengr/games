export type Cell = "X" | "O" | null;
export type Board = Cell[];
export type Difficulty = "easy" | "medium" | "hard";
export type Winner = "X" | "O" | "draw" | null;

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => null);
}

export function getWinner(board: Board): Winner {
  for (const [a, b, c] of LINES) {
    const v = board[a];
    if (v && v === board[b] && v === board[c]) return v;
  }
  if (board.every((cell) => cell !== null)) return "draw";
  return null;
}

export function winningLine(board: Board): number[] | null {
  for (const line of LINES) {
    const [a, b, c] = line;
    const v = board[a];
    if (v && v === board[b] && v === board[c]) return [...line];
  }
  return null;
}

function availableMoves(board: Board): number[] {
  return board
    .map((cell, i) => (cell === null ? i : -1))
    .filter((i) => i >= 0);
}

function minimax(
  board: Board,
  isMax: boolean,
  ai: Cell,
  human: Cell,
): number {
  const result = getWinner(board);
  if (result === ai) return 10;
  if (result === human) return -10;
  if (result === "draw") return 0;

  if (isMax) {
    let best = -Infinity;
    for (const move of availableMoves(board)) {
      board[move] = ai;
      best = Math.max(best, minimax(board, false, ai, human));
      board[move] = null;
    }
    return best;
  }

  let best = Infinity;
  for (const move of availableMoves(board)) {
    board[move] = human;
    best = Math.min(best, minimax(board, true, ai, human));
    board[move] = null;
  }
  return best;
}

function bestMove(board: Board, ai: Cell, human: Cell): number {
  let bestScore = -Infinity;
  let move = availableMoves(board)[0] ?? 0;
  for (const i of availableMoves(board)) {
    board[i] = ai;
    const score = minimax(board, false, ai, human);
    board[i] = null;
    if (score > bestScore) {
      bestScore = score;
      move = i;
    }
  }
  return move;
}

function randomMove(board: Board): number {
  const moves = availableMoves(board);
  return moves[Math.floor(Math.random() * moves.length)] ?? 0;
}

export function aiPick(
  board: Board,
  difficulty: Difficulty,
  ai: Cell = "O",
  human: Cell = "X",
): number {
  const moves = availableMoves(board);
  if (moves.length === 0) return 0;

  if (difficulty === "easy") {
    return randomMove(board);
  }

  if (difficulty === "medium") {
    return Math.random() < 0.55
      ? bestMove(board, ai, human)
      : randomMove(board);
  }

  return bestMove(board, ai, human);
}
