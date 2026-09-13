export type Point = { x: number; y: number };
export type Dir = "up" | "down" | "left" | "right";

export const GRID = 16;

const opposite: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function spawnFood(snake: Point[]): Point {
  while (true) {
    const food = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
    if (!snake.some((s) => s.x === food.x && s.y === food.y)) return food;
  }
}

export function step(
  snake: Point[],
  dir: Dir,
  food: Point,
): { snake: Point[]; food: Point; ate: boolean; dead: boolean } {
  const head = snake[0];
  if (!head) {
    return { snake, food, ate: false, dead: true };
  }

  const next = { ...head };
  if (dir === "up") next.y -= 1;
  if (dir === "down") next.y += 1;
  if (dir === "left") next.x -= 1;
  if (dir === "right") next.x += 1;

  if (next.x < 0 || next.y < 0 || next.x >= GRID || next.y >= GRID) {
    return { snake, food, ate: false, dead: true };
  }

  if (snake.some((s) => s.x === next.x && s.y === next.y)) {
    return { snake, food, ate: false, dead: true };
  }

  const grew = next.x === food.x && next.y === food.y;
  const body = [next, ...snake];
  if (!grew) body.pop();

  return {
    snake: body,
    food: grew ? spawnFood(body) : food,
    ate: grew,
    dead: false,
  };
}

export function canTurn(current: Dir, next: Dir): boolean {
  return opposite[current] !== next;
}

export function startSnake(): Point[] {
  const mid = Math.floor(GRID / 2);
  return [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
}
