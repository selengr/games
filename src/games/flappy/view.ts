import { bindChrome, renderChrome, refreshMuteButton } from "../../shared/chrome";
import { sfx, unlockAudio } from "../../shared/audio";
import { loadJson, saveJson } from "../../shared/storage";
import { checkFlappyScore, markPlayed } from "../../shared/achievements";
import { announceUnlocks } from "../../shared/toast";
import { pushHistory } from "../../shared/history";
import { maybeCompleteDaily } from "../../shared/dailyComplete";
import { createFlappy, flap, stepFlappy, type FlappyState } from "./logic";
import "./flappy.css";

const BEST_KEY = "arcade-flappy-best";

type Phase = "running" | "over";

export function renderFlappy(root: HTMLElement): void {
  markPlayed("flappy");
  let best = loadJson<number>(BEST_KEY, 0);
  let state: FlappyState | null = null;
  let phase: Phase = "running";
  let raf = 0;
  let lastTs = 0;
  let acc = 0;

  root.innerHTML = `
    <div class="shell route-fade">
      ${renderChrome({ showBack: true })}
      <section class="panel">
        <h2>Flappy Lite</h2>
        <p class="hint">Tap or press Space to flap through the gaps.</p>
        <div class="scoreboard">
          <span class="score-pill" data-score>Score 0</span>
          <span class="score-pill" data-best>Best ${best}</span>
        </div>
        <p class="status" data-status aria-live="polite">Flap!</p>
        <div class="flappy-wrap">
          <canvas class="flappy-canvas" width="360" height="540" aria-label="Flappy Lite"></canvas>
        </div>
        <div class="row" style="margin-top:1rem">
          <button class="btn btn-primary" type="button" data-again hidden>Play again</button>
        </div>
      </section>
    </div>
  `;

  bindChrome(root, () => refreshMuteButton(root));

  const canvas = root.querySelector<HTMLCanvasElement>(".flappy-canvas");
  const scoreEl = root.querySelector<HTMLElement>("[data-score]");
  const bestEl = root.querySelector<HTMLElement>("[data-best]");
  const statusEl = root.querySelector<HTMLElement>("[data-status]");
  const againBtn = root.querySelector<HTMLButtonElement>("[data-again]");

  const syncHud = (): void => {
    if (!state) return;
    if (scoreEl) scoreEl.textContent = `Score ${state.score}`;
    if (bestEl) bestEl.textContent = `Best ${best}`;
    if (statusEl) {
      statusEl.textContent = phase === "over" ? "Crashed!" : "Flap!";
    }
    if (againBtn) againBtn.hidden = phase === "running";
  };

  const draw = (): void => {
    if (!canvas || !state) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#1c4550");
    g.addColorStop(0.7, "#0b1f24");
    g.addColorStop(1, "#163038");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const pipe of state.pipes) {
      ctx.fillStyle = "#2dd4bf";
      ctx.fillRect(pipe.x, 0, pipe.w, pipe.gapY);
      ctx.fillRect(
        pipe.x,
        pipe.gapY + pipe.gapH,
        pipe.w,
        state.height - (pipe.gapY + pipe.gapH),
      );
      ctx.fillStyle = "#c8f542";
      ctx.fillRect(pipe.x - 2, pipe.gapY - 10, pipe.w + 4, 10);
      ctx.fillRect(pipe.x - 2, pipe.gapY + pipe.gapH, pipe.w + 4, 10);
    }

    const bird = state.bird;
    ctx.fillStyle = "#ff6b4a";
    ctx.beginPath();
    ctx.ellipse(bird.x, bird.y, bird.r * 1.1, bird.r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0b1f24";
    ctx.beginPath();
    ctx.arc(bird.x + 5, bird.y - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();
  };

  const stop = (): void => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastTs = 0;
    acc = 0;
  };

  const finish = (): void => {
    phase = "over";
    stop();
    sfx.die();
    if (state && state.score > best) {
      best = state.score;
      saveJson(BEST_KEY, best);
    }
    pushHistory("Flappy Lite", `score ${state?.score ?? 0}`);
    maybeCompleteDaily("flappy", state?.score ?? 0);
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
      const result = stepFlappy(state);
      if (result === "score") {
        sfx.score();
        announceUnlocks(checkFlappyScore(state.score));
        maybeCompleteDaily("flappy", state.score);
      }
      if (result === "die") {
        draw();
        finish();
        return;
      }
    }
    draw();
    syncHud();
    raf = requestAnimationFrame(frame);
  };

  const start = (): void => {
    if (!canvas) return;
    stop();
    state = createFlappy(canvas.width, canvas.height);
    phase = "running";
    flap(state);
    syncHud();
    draw();
    raf = requestAnimationFrame(frame);
  };

  const doFlap = (): void => {
    if (!state || phase !== "running") return;
    unlockAudio();
    flap(state);
    sfx.flap();
  };

  canvas?.addEventListener(
    "pointerdown",
    (e) => {
      e.preventDefault();
      if (phase === "over") return;
      doFlap();
    },
    { passive: false },
  );

  const onKey = (e: KeyboardEvent): void => {
    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      if (phase === "over") return;
      doFlap();
    }
  };
  window.addEventListener("keydown", onKey);

  againBtn?.addEventListener("click", () => {
    sfx.tap();
    start();
  });

  const host = root as HTMLElement & { __flappyCleanup?: () => void };
  host.__flappyCleanup?.();
  host.__flappyCleanup = () => {
    stop();
    window.removeEventListener("keydown", onKey);
  };

  start();
}
