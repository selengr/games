export type Bird = {
  x: number;
  y: number;
  vy: number;
  r: number;
};

export type Pipe = {
  x: number;
  gapY: number;
  gapH: number;
  w: number;
  scored: boolean;
};

export type FlappyState = {
  bird: Bird;
  pipes: Pipe[];
  score: number;
  width: number;
  height: number;
  alive: boolean;
  spawnAcc: number;
};

const GRAVITY = 0.28;
const FLAP_V = -5.2;
const PIPE_SPEED = 2.4;
const PIPE_GAP = 128;
const PIPE_W = 52;
const PIPE_EVERY = 110;

export function createFlappy(width: number, height: number): FlappyState {
  return {
    bird: {
      x: width * 0.28,
      y: height * 0.45,
      vy: 0,
      r: 14,
    },
    pipes: [],
    score: 0,
    width,
    height,
    alive: true,
    spawnAcc: PIPE_EVERY - 20,
  };
}

export function flap(state: FlappyState): void {
  if (!state.alive) return;
  state.bird.vy = FLAP_V;
}

function spawnPipe(state: FlappyState): void {
  const margin = 48;
  const gapH = PIPE_GAP;
  const maxTop = state.height - margin - gapH;
  const gapY = margin + Math.random() * Math.max(20, maxTop - margin);
  state.pipes.push({
    x: state.width + 10,
    gapY,
    gapH,
    w: PIPE_W,
    scored: false,
  });
}

function hitsPipe(bird: Bird, pipe: Pipe): boolean {
  const inX = bird.x + bird.r > pipe.x && bird.x - bird.r < pipe.x + pipe.w;
  if (!inX) return false;
  const top = pipe.gapY;
  const bottom = pipe.gapY + pipe.gapH;
  return bird.y - bird.r < top || bird.y + bird.r > bottom;
}

export function stepFlappy(state: FlappyState): "play" | "score" | "die" {
  if (!state.alive) return "die";

  const bird = state.bird;
  bird.vy += GRAVITY;
  bird.y += bird.vy;

  if (bird.y + bird.r >= state.height || bird.y - bird.r <= 0) {
    state.alive = false;
    return "die";
  }

  state.spawnAcc += 1;
  if (state.spawnAcc >= PIPE_EVERY) {
    state.spawnAcc = 0;
    spawnPipe(state);
  }

  let scored = false;
  for (const pipe of state.pipes) {
    pipe.x -= PIPE_SPEED;
    if (!pipe.scored && pipe.x + pipe.w < bird.x) {
      pipe.scored = true;
      state.score += 1;
      scored = true;
    }
    if (hitsPipe(bird, pipe)) {
      state.alive = false;
      return "die";
    }
  }

  state.pipes = state.pipes.filter((p) => p.x + p.w > -20);
  return scored ? "score" : "play";
}
