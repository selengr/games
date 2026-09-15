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
  /** Cap downward speed so hard doesn't feel like an instant dive. */
  maxFall: number;
  /** 0 = fully random gaps; 1 = strongly prefer center. */
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
    gravity: 0.22,
    flapV: -4.8,
    pipeSpeed: 1.9,
    pipeGap: 152,
    pipeEvery: 125,
    pipeW: 48,
    maxFall: 7.5,
    centerBias: 0.15,
  },
  normal: {
    gravity: 0.28,
    flapV: -5.2,
    pipeSpeed: 2.4,
    pipeGap: 128,
    pipeEvery: 110,
    pipeW: 52,
    maxFall: 8.2,
    centerBias: 0.25,
  },
  hard: {
    gravity: 0.31,
    flapV: -5.35,
    pipeSpeed: 2.85,
    pipeGap: 116,
    pipeEvery: 100,
    pipeW: 54,
    maxFall: 8.6,
    centerBias: 0.55,
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
    spawnAcc: config.pipeEvery - 20,
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
  const margin = 52;
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
    x: state.width + 10,
    gapY,
    gapH,
    w: state.config.pipeW,
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
  const { gravity, pipeSpeed, pipeEvery, maxFall } = state.config;
  bird.vy = Math.min(maxFall, bird.vy + gravity);
  bird.y += bird.vy;

  if (bird.y + bird.r >= state.height || bird.y - bird.r <= 0) {
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

export function flappyBestKey(diff: FlappyDiff): string {
  return `arcade-flappy-best-${diff}`;
}
