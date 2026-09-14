export type Brick = {
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
  color: string;
};

export type BreakoutState = {
  paddleX: number;
  paddleW: number;
  paddleH: number;
  ballX: number;
  ballY: number;
  ballR: number;
  vx: number;
  vy: number;
  bricks: Brick[];
  lives: number;
  score: number;
  width: number;
  height: number;
};

const COLORS = ["#c8f542", "#2dd4bf", "#ff6b4a", "#e8f4f1", "#7dd3fc"];

export function createBreakout(width: number, height: number): BreakoutState {
  const paddleW = Math.max(72, width * 0.22);
  const paddleH = 14;
  const bricks: Brick[] = [];
  const cols = 8;
  const rows = 4;
  const gap = 6;
  const top = 48;
  const brickW = (width - gap * (cols + 1)) / cols;
  const brickH = 18;

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      bricks.push({
        x: gap + c * (brickW + gap),
        y: top + r * (brickH + gap),
        w: brickW,
        h: brickH,
        alive: true,
        color: COLORS[r % COLORS.length]!,
      });
    }
  }

  return {
    paddleX: width / 2 - paddleW / 2,
    paddleW,
    paddleH,
    ballX: width / 2,
    ballY: height - 60,
    ballR: 8,
    vx: 2.4,
    vy: -3.2,
    bricks,
    lives: 3,
    score: 0,
    width,
    height,
  };
}

export function movePaddle(state: BreakoutState, x: number): void {
  state.paddleX = Math.max(
    0,
    Math.min(state.width - state.paddleW, x - state.paddleW / 2),
  );
}

export function stepBreakout(state: BreakoutState): "play" | "life" | "clear" | "over" {
  state.ballX += state.vx;
  state.ballY += state.vy;

  if (state.ballX - state.ballR <= 0 || state.ballX + state.ballR >= state.width) {
    state.vx *= -1;
    state.ballX = Math.max(state.ballR, Math.min(state.width - state.ballR, state.ballX));
  }
  if (state.ballY - state.ballR <= 0) {
    state.vy *= -1;
    state.ballY = state.ballR;
  }

  const py = state.height - 28;
  if (
    state.vy > 0 &&
    state.ballY + state.ballR >= py &&
    state.ballY + state.ballR <= py + state.paddleH + 8 &&
    state.ballX >= state.paddleX &&
    state.ballX <= state.paddleX + state.paddleW
  ) {
    state.vy *= -1;
    const hit = (state.ballX - state.paddleX) / state.paddleW - 0.5;
    state.vx = hit * 6.5;
    state.ballY = py - state.ballR;
  }

  for (const brick of state.bricks) {
    if (!brick.alive) continue;
    if (
      state.ballX + state.ballR > brick.x &&
      state.ballX - state.ballR < brick.x + brick.w &&
      state.ballY + state.ballR > brick.y &&
      state.ballY - state.ballR < brick.y + brick.h
    ) {
      brick.alive = false;
      state.score += 1;
      state.vy *= -1;
      break;
    }
  }

  if (state.bricks.every((b) => !b.alive)) return "clear";

  if (state.ballY - state.ballR > state.height) {
    state.lives -= 1;
    if (state.lives <= 0) return "over";
    state.ballX = state.width / 2;
    state.ballY = state.height - 60;
    state.vx = 2.4 * (Math.random() > 0.5 ? 1 : -1);
    state.vy = -3.2;
    return "life";
  }

  return "play";
}
