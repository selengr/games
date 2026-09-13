import { bindChrome, renderChrome } from "../../shared/chrome";
import { sfx, unlockAudio } from "../../shared/audio";
import { loadJson, saveJson } from "../../shared/storage";
import {
  GRID,
  canTurn,
  spawnFood,
  startSnake,
  step,
  type Dir,
  type Point,
} from "./logic";
import "./snake.css";

const BEST_KEY = "arcade-snake-best";
const TICK_MS = 120;

type Phase = "ready" | "running" | "paused" | "over";

export function renderSnake(root: HTMLElement): void {
  let snake = startSnake();
  let dir: Dir = "right";
  let pending: Dir | null = null;
  let food = spawnFood(snake);
  let score = 0;
  let best = loadJson<number>(BEST_KEY, 0);
  let phase: Phase = "ready";
  let timer: number | null = null;
  let lastTouch: Point | null = null;

  const stopLoop = (): void => {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  const paint = (): void => {
    const status =
      phase === "ready"
        ? "Press Start or hit an arrow key"
        : phase === "paused"
          ? "Paused"
          : phase === "over"
            ? `Game over · score ${score}`
            : "Go!";

    root.innerHTML = `
      <div class="shell">
        ${renderChrome({ showBack: true })}
        <section class="panel">
          <h2>Snake</h2>
          <p class="muted">Eat the dots. Don't hit the walls — or yourself.</p>
          <div class="scoreboard">
            <span class="score-pill">Score ${score}</span>
            <span class="score-pill">Best ${best}</span>
          </div>
          <p class="status">${status}</p>
          <div class="snake-wrap">
            <canvas class="snake-canvas" width="480" height="480" aria-label="Snake game board"></canvas>
            <div class="row">
              ${
                phase === "running"
                  ? `<button class="btn btn-ghost" type="button" data-pause>Pause</button>`
                  : phase === "paused"
                    ? `<button class="btn btn-primary" type="button" data-resume>Resume</button>`
                    : `<button class="btn btn-primary" type="button" data-start>${phase === "over" ? "Play again" : "Start"}</button>`
              }
            </div>
            <p class="hint">Keyboard: arrows or WASD · Space to pause</p>
            <div class="snake-pad" aria-label="Touch controls">
              <button class="btn btn-ghost" type="button" data-dir="up">↑</button>
              <button class="btn btn-ghost" type="button" data-dir="left">←</button>
              <button class="btn btn-ghost" type="button" data-dir="down">↓</button>
              <button class="btn btn-ghost" type="button" data-dir="right">→</button>
            </div>
          </div>
        </section>
      </div>
    `;

    bindChrome(root, paint);
    draw();

    root.querySelector("[data-start]")?.addEventListener("click", () => {
      unlockAudio();
      sfx.tap();
      reset(true);
    });
    root.querySelector("[data-pause]")?.addEventListener("click", () => {
      phase = "paused";
      stopLoop();
      paint();
    });
    root.querySelector("[data-resume]")?.addEventListener("click", () => {
      unlockAudio();
      phase = "running";
      startLoop();
      paint();
    });

    root.querySelectorAll<HTMLButtonElement>("[data-dir]").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        queueDir(btn.dataset.dir as Dir);
        if (phase === "ready") {
          reset(true);
        }
      });
    });

    const canvas = root.querySelector<HTMLCanvasElement>(".snake-canvas");
    canvas?.addEventListener(
      "touchstart",
      (e) => {
        const t = e.changedTouches[0];
        if (!t) return;
        lastTouch = { x: t.clientX, y: t.clientY };
      },
      { passive: true },
    );
    canvas?.addEventListener(
      "touchend",
      (e) => {
        const t = e.changedTouches[0];
        if (!t || !lastTouch) return;
        const dx = t.clientX - lastTouch.x;
        const dy = t.clientY - lastTouch.y;
        if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          queueDir(dx > 0 ? "right" : "left");
        } else {
          queueDir(dy > 0 ? "down" : "up");
        }
        if (phase === "ready") reset(true);
        lastTouch = null;
      },
      { passive: true },
    );
  };

  const draw = (): void => {
    const canvas = root.querySelector<HTMLCanvasElement>(".snake-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cell = canvas.width / GRID;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0b1f24";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(232,244,241,0.05)";
    for (let i = 0; i <= GRID; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cell);
      ctx.lineTo(canvas.width, i * cell);
      ctx.stroke();
    }

    ctx.fillStyle = "#ff6b4a";
    ctx.beginPath();
    ctx.arc(
      food.x * cell + cell / 2,
      food.y * cell + cell / 2,
      cell * 0.32,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? "#c8f542" : "#2dd4bf";
      const pad = i === 0 ? 1.5 : 2.5;
      ctx.fillRect(
        seg.x * cell + pad,
        seg.y * cell + pad,
        cell - pad * 2,
        cell - pad * 2,
      );
    });
  };

  const queueDir = (next: Dir): void => {
    const base = pending ?? dir;
    if (canTurn(base, next)) pending = next;
  };

  const tick = (): void => {
    if (phase !== "running") return;
    if (pending && canTurn(dir, pending)) {
      dir = pending;
      pending = null;
    }

    const result = step(snake, dir, food);
    if (result.dead) {
      phase = "over";
      stopLoop();
      sfx.die();
      if (score > best) {
        best = score;
        saveJson(BEST_KEY, best);
      }
      paint();
      return;
    }

    snake = result.snake;
    food = result.food;
    if (result.ate) {
      score += 1;
      sfx.eat();
    }
    draw();
    const scoreEl = root.querySelector(".scoreboard");
    if (scoreEl) {
      scoreEl.innerHTML = `
        <span class="score-pill">Score ${score}</span>
        <span class="score-pill">Best ${best}</span>
      `;
    }
  };

  const startLoop = (): void => {
    stopLoop();
    timer = window.setInterval(tick, TICK_MS);
  };

  const reset = (autoStart: boolean): void => {
    stopLoop();
    snake = startSnake();
    dir = "right";
    pending = null;
    food = spawnFood(snake);
    score = 0;
    phase = autoStart ? "running" : "ready";
    paint();
    if (autoStart) startLoop();
  };

  const onKey = (e: KeyboardEvent): void => {
    const map: Record<string, Dir> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right",
      W: "up",
      S: "down",
      A: "left",
      D: "right",
    };

    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      if (phase === "running") {
        phase = "paused";
        stopLoop();
        paint();
      } else if (phase === "paused") {
        phase = "running";
        startLoop();
        paint();
      }
      return;
    }

    const next = map[e.key];
    if (!next) return;
    e.preventDefault();
    unlockAudio();
    queueDir(next);
    if (phase === "ready" || phase === "over") reset(true);
  };

  window.addEventListener("keydown", onKey);
  const prevCleanup = (root as HTMLElement & { __snakeCleanup?: () => void })
    .__snakeCleanup;
  prevCleanup?.();
  (root as HTMLElement & { __snakeCleanup?: () => void }).__snakeCleanup = () => {
    window.removeEventListener("keydown", onKey);
    stopLoop();
  };

  paint();
}
