import { bindChrome, renderChrome, refreshMuteButton } from "../../shared/chrome";
import { sfx, unlockAudio } from "../../shared/audio";
import { loadJson, saveJson } from "../../shared/storage";
import { checkBreakoutClear, markPlayed } from "../../shared/achievements";
import { announceUnlocks } from "../../shared/toast";
import { burstAtElement } from "../../shared/fx";
import { pushHistory } from "../../shared/history";
import { maybeCompleteDaily } from "../../shared/dailyComplete";
import {
  createBreakout,
  movePaddle,
  stepBreakout,
  type BreakoutState,
} from "./logic";
import "./breakout.css";

const BEST_KEY = "arcade-breakout-best";

type Phase = "running" | "over" | "clear";

export function renderBreakout(root: HTMLElement): void {
  markPlayed("breakout");
  let best = loadJson<number>(BEST_KEY, 0);
  let phase: Phase = "running";
  let state: BreakoutState | null = null;
  let raf = 0;
  let acc = 0;
  let lastTs = 0;

  root.innerHTML = `
    <div class="shell route-fade">
      ${renderChrome({ showBack: true })}
      <section class="panel">
        <h2>Breakout</h2>
        <div class="scoreboard">
          <span class="score-pill" data-score>Score 0</span>
          <span class="score-pill" data-lives>Lives 3</span>
          <span class="score-pill" data-best>Best ${best}</span>
        </div>
        <p class="status" data-status aria-live="polite">Drag to move</p>
        <div class="breakout-wrap">
          <canvas class="breakout-canvas" width="480" height="360" aria-label="Breakout"></canvas>
        </div>
        <div class="row" style="margin-top:1rem">
          <button class="btn btn-primary" type="button" data-again hidden>Play again</button>
        </div>
      </section>
    </div>
  `;

  bindChrome(root, () => refreshMuteButton(root));

  const canvas = root.querySelector<HTMLCanvasElement>(".breakout-canvas");
  const scoreEl = root.querySelector<HTMLElement>("[data-score]");
  const livesEl = root.querySelector<HTMLElement>("[data-lives]");
  const bestEl = root.querySelector<HTMLElement>("[data-best]");
  const statusEl = root.querySelector<HTMLElement>("[data-status]");
  const againBtn = root.querySelector<HTMLButtonElement>("[data-again]");

  const syncHud = (): void => {
    if (!state) return;
    if (scoreEl) scoreEl.textContent = `Score ${state.score}`;
    if (livesEl) livesEl.textContent = `Lives ${state.lives}`;
    if (bestEl) bestEl.textContent = `Best ${best}`;
    if (statusEl) {
      statusEl.textContent =
        phase === "clear"
          ? "All clear!"
          : phase === "over"
            ? "Game over"
            : "Drag to move";
    }
    if (againBtn) againBtn.hidden = phase === "running";
  };

  const draw = (): void => {
    if (!canvas || !state) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0b1f24";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const brick of state.bricks) {
      if (!brick.alive) continue;
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
    }

    ctx.fillStyle = "#c8f542";
    ctx.fillRect(
      state.paddleX,
      state.height - 28,
      state.paddleW,
      state.paddleH,
    );

    ctx.fillStyle = "#ff6b4a";
    ctx.beginPath();
    ctx.arc(state.ballX, state.ballY, state.ballR, 0, Math.PI * 2);
    ctx.fill();
  };

  const stop = (): void => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastTs = 0;
    acc = 0;
  };

  const finish = (next: Phase): void => {
    phase = next;
    stop();
    if (state && state.score > best) {
      best = state.score;
      saveJson(BEST_KEY, best);
    }
    if (next === "clear") {
      sfx.win();
      burstAtElement(canvas);
      announceUnlocks(checkBreakoutClear());
      pushHistory("Breakout", `cleared · ${state?.score ?? 0}`);
      maybeCompleteDaily("breakout", 1);
    } else {
      sfx.die();
      pushHistory("Breakout", `score ${state?.score ?? 0}`);
    }
    syncHud();
  };

  const frame = (ts: number): void => {
    if (phase !== "running" || !state) return;
    if (!lastTs) lastTs = ts;
    const delta = ts - lastTs;
    lastTs = ts;
    acc += delta;
    while (acc >= 16) {
      acc -= 16;
      const result = stepBreakout(state);
      if (result === "clear") {
        draw();
        finish("clear");
        return;
      }
      if (result === "over") {
        draw();
        finish("over");
        return;
      }
      if (result === "life") sfx.lose();
    }
    draw();
    syncHud();
    raf = requestAnimationFrame(frame);
  };

  const start = (): void => {
    if (!canvas) return;
    stop();
    state = createBreakout(canvas.width, canvas.height);
    phase = "running";
    syncHud();
    draw();
    raf = requestAnimationFrame(frame);
  };

  const pointer = (clientX: number): void => {
    if (!canvas || !state || phase !== "running") return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    movePaddle(state, x);
  };

  canvas?.addEventListener("pointerdown", (e) => {
    unlockAudio();
    canvas.setPointerCapture(e.pointerId);
    pointer(e.clientX);
  });
  canvas?.addEventListener("pointermove", (e) => {
    if (e.buttons || e.pressure > 0) pointer(e.clientX);
  });

  againBtn?.addEventListener("click", () => {
    sfx.tap();
    start();
  });

  const host = root as HTMLElement & { __breakoutCleanup?: () => void };
  host.__breakoutCleanup?.();
  host.__breakoutCleanup = stop;

  start();
}
