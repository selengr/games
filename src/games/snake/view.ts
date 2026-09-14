import { bindChrome, renderChrome } from "../../shared/chrome";
import { sfx, unlockAudio } from "../../shared/audio";
import { loadJson, saveJson } from "../../shared/storage";
import { getSettings, setSnakePrefs } from "../../shared/settings";
import { checkSnakeScore, markPlayed } from "../../shared/achievements";
import { announceUnlocks } from "../../shared/toast";
import { burstAtElement } from "../../shared/fx";
import { shareText } from "../../shared/share";
import {
  GRID,
  canTurn,
  spawnFood,
  startSnake,
  step,
  tickMs,
  type Dir,
  type Point,
  type Speed,
} from "./logic";
import "./snake.css";

function bestKey(speed: Speed): string {
  return `arcade-snake-best-${speed}`;
}

type Phase = "ready" | "running" | "paused" | "over";

export function renderSnake(root: HTMLElement): void {
  markPlayed("snake");
  const prefs = getSettings();
  let snake = startSnake();
  let dir: Dir = "right";
  let pending: Dir | null = null;
  let food = spawnFood(snake);
  let score = 0;
  let speed: Speed = prefs.snakeSpeed;
  let wrap = prefs.snakeWrap;
  let best = loadJson<number>(bestKey(speed), 0);
  let phase: Phase = "ready";
  let raf = 0;
  let lastTs = 0;
  let acc = 0;
  let lastTouch: Point | null = null;

  const stopLoop = (): void => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    lastTs = 0;
    acc = 0;
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
      <div class="shell route-fade">
        ${renderChrome({ showBack: true, helpGame: "snake" })}
        <section class="panel">
          <h2>Snake</h2>
          <p class="muted">Eat the dots. Walls kill you — unless wrap is on.</p>
          <div class="row" role="group" aria-label="Speed">
            ${(["chill", "normal", "insane"] as Speed[])
              .map(
                (level) => `
              <button class="btn btn-ghost ${speed === level ? "btn-active" : ""}" type="button" data-speed="${level}">
                ${level}
              </button>
            `,
              )
              .join("")}
            <button class="btn btn-ghost ${wrap ? "btn-active" : ""}" type="button" data-wrap>
              ${wrap ? "wrap on" : "wrap off"}
            </button>
          </div>
          <div class="scoreboard">
            <span class="score-pill">Score ${score}</span>
            <span class="score-pill">Best (${speed}) ${best}</span>
          </div>
          <p class="status">${status}</p>
          ${
            phase === "over"
              ? `<div class="overlay-card"><strong>Game over</strong>Score ${score}. Share it or run it back.</div>`
              : ""
          }
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
              ${
                phase === "over"
                  ? `<button class="btn btn-ghost" type="button" data-share>Share score</button>`
                  : ""
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

    bindChrome(root, paint, "snake");
    draw();

    root.querySelectorAll<HTMLButtonElement>("[data-speed]").forEach((btn) => {
      btn.addEventListener("click", () => {
        sfx.tap();
        speed = btn.dataset.speed as Speed;
        best = loadJson<number>(bestKey(speed), 0);
        setSnakePrefs(speed, wrap);
        if (phase === "running") {
          acc = 0;
        }
        paint();
      });
    });

    root.querySelector("[data-wrap]")?.addEventListener("click", () => {
      sfx.tap();
      wrap = !wrap;
      setSnakePrefs(speed, wrap);
      if (phase !== "running") reset(false);
      else paint();
    });

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
    root.querySelector("[data-share]")?.addEventListener("click", () => {
      void shareText(
        "Arcade Hub Snake",
        `I scored ${score} on Snake (${speed}${wrap ? ", wrap" : ""}) in Arcade Hub.`,
      );
    });

    root.querySelectorAll<HTMLButtonElement>("[data-dir]").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudio();
        queueDir(btn.dataset.dir as Dir);
        if (phase === "ready") reset(true);
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
        if (Math.abs(dx) > Math.abs(dy)) queueDir(dx > 0 ? "right" : "left");
        else queueDir(dy > 0 ? "down" : "up");
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

    const result = step(snake, dir, food, wrap);
    if (result.dead) {
      phase = "over";
      stopLoop();
      sfx.die();
      if (score > best) {
        best = score;
        saveJson(bestKey(speed), best);
        const overall = loadJson<number>("arcade-snake-best", 0);
        if (score > overall) saveJson("arcade-snake-best", score);
      }
      paint();
      return;
    }

    snake = result.snake;
    food = result.food;
    if (result.ate) {
      score += 1;
      sfx.eat();
      burstAtElement(root.querySelector(".snake-canvas"));
      announceUnlocks(checkSnakeScore(score));
    }
    draw();
    const scoreEl = root.querySelector(".scoreboard");
    if (scoreEl) {
      scoreEl.innerHTML = `
        <span class="score-pill">Score ${score}</span>
        <span class="score-pill">Best (${speed}) ${best}</span>
      `;
    }
  };

  const frame = (ts: number): void => {
    if (phase !== "running") return;
    if (!lastTs) lastTs = ts;
    const delta = ts - lastTs;
    lastTs = ts;
    acc += delta;
    const stepEvery = tickMs(speed);
    while (acc >= stepEvery) {
      acc -= stepEvery;
      tick();
      if (phase !== "running") return;
    }
    raf = requestAnimationFrame(frame);
  };

  const startLoop = (): void => {
    stopLoop();
    raf = requestAnimationFrame(frame);
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
    if (root.querySelector("[data-help-modal]")) return;
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
  const host = root as HTMLElement & { __snakeCleanup?: () => void };
  host.__snakeCleanup?.();
  host.__snakeCleanup = () => {
    window.removeEventListener("keydown", onKey);
    stopLoop();
  };

  paint();
}
