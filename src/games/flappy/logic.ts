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

export type FlappyDiff = "easy" | "normal" | "hard";

export type FlappyConfig = {
  gravity: number;
  flapV: number;
  pipeSpeed: number;
  pipeGap: number;
  pipeEvery: number;
  pipeW: number;
  maxFall: number;
  centerBias: number;
};

export type FlappyState = {
  bird: Bird;
  pipes: Pipe[];
  score: number;
  width: number;
  height: number;
  alive: boolean;
  spawnAcc: number;
  difficulty: FlappyDiff;
  config: FlappyConfig;
};

export const FLAPPY_DIFFS: FlappyDiff[] = ["easy", "normal", "hard"];

export const FLAPPY_CONFIG: Record<FlappyDiff, FlappyConfig> = {
  easy: {
    gravity: 0.16,
    flapV: -4.2,
    pipeSpeed: 1.45,
    pipeGap: 178,
    pipeEvery: 150,
    pipeW: 46,
    maxFall: 5.5,
    centerBias: 0.35,
  },
  normal: {
    gravity: 0.24,
    flapV: -4.9,
    pipeSpeed: 2.05,
    pipeGap: 142,
    pipeEvery: 120,
    pipeW: 50,
    maxFall: 7.0,
    centerBias: 0.3,
  },
  hard: {
    gravity: 0.29,
    flapV: -5.2,
    pipeSpeed: 2.55,
    pipeGap: 124,
    pipeEvery: 105,
    pipeW: 52,
    maxFall: 7.8,
    centerBias: 0.45,
  },
};

export function createFlappy(
  width: number,
  height: number,
  difficulty: FlappyDiff = "normal",
): FlappyState {
  const config = FLAPPY_CONFIG[difficulty];
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
    spawnAcc: 0,
    difficulty,
    config,
  };
}

export function flap(state: FlappyState): void {
  if (!state.alive) return;
  state.bird.vy = state.config.flapV;
}

function pickGapY(
  height: number,
  gapH: number,
  centerBias: number,
  rand = Math.random,
): number {
  const margin = 56;
  const minY = margin;
  const maxY = height - margin - gapH;
  const span = Math.max(1, maxY - minY);
  const raw = rand();
  const centered = 0.5 + (raw - 0.5) * (1 - centerBias);
  const t = Math.min(1, Math.max(0, centered));
  return minY + t * span;
}

function spawnPipe(state: FlappyState): void {
  const gapH = state.config.pipeGap;
  const gapY = pickGapY(state.height, gapH, state.config.centerBias);
  state.pipes.push({
    x: state.width + 8,
    gapY,
    gapH,
    w: state.config.pipeW,
    scored: false,
  });
}

/** Slightly smaller than the drawn bird so hits feel fair. */
function hitRadius(bird: Bird): number {
  return bird.r * 0.82;
}

function hitsPipe(bird: Bird, pipe: Pipe): boolean {
  const r = hitRadius(bird);
  const inX = bird.x + r > pipe.x && bird.x - r < pipe.x + pipe.w;
  if (!inX) return false;
  const top = pipe.gapY;
  const bottom = pipe.gapY + pipe.gapH;
  return bird.y - r < top || bird.y + r > bottom;
}

export function stepFlappy(state: FlappyState): "play" | "score" | "die" {
  if (!state.alive) return "die";

  const bird = state.bird;
  const { gravity, pipeSpeed, pipeEvery, maxFall } = state.config;
  bird.vy = Math.min(maxFall, bird.vy + gravity);
  bird.y += bird.vy;

  const r = hitRadius(bird);
  if (bird.y + r >= state.height || bird.y - r <= 0) {
    state.alive = false;
    return "die";
  }

  state.spawnAcc += 1;
  if (state.spawnAcc >= pipeEvery) {
    state.spawnAcc = 0;
    spawnPipe(state);
  }

  let scored = false;
  for (const pipe of state.pipes) {
    pipe.x -= pipeSpeed;
    if (!pipe.scored && pipe.x + pipe.w < bird.x - r) {
      pipe.scored = true;
      state.score += 1;
      scored = true;
    }
    if (hitsPipe(bird, pipe)) {
      state.alive = false;
      return "die";
    }
  }

  state.pipes = state.pipes.filter((p) => p.x + p.w > -24);
  return scored ? "score" : "play";
}

export function flappyBestKey(diff: FlappyDiff): string {
  return `arcade-flappy-best-${diff}`;
}

export function parseFlappyDiff(text: string): FlappyDiff | null {
  const match = /\b(easy|normal|hard)\b/i.exec(text);
  if (!match) return null;
  return match[1]!.toLowerCase() as FlappyDiff;
}

/** Keys that flap / start / retry. */
export function isFlapKey(e: KeyboardEvent): boolean {
  return (
    e.code === "Space" ||
    e.key === " " ||
    e.code === "ArrowUp" ||
    e.code === "KeyW" ||
    e.key === "w" ||
    e.key === "W" ||
    e.code === "Enter" ||
    e.key === "Enter"
  );
}
