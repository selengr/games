import { bindChrome, renderChrome, refreshMuteButton } from "../../shared/chrome";
import { sfx, unlockAudio } from "../../shared/audio";
import { loadJson, saveJson } from "../../shared/storage";
import { checkFlappyScore, markPlayed } from "../../shared/achievements";
import { announceUnlocks } from "../../shared/toast";
import { pushHistory } from "../../shared/history";
import { maybeCompleteDaily } from "../../shared/dailyComplete";
import { getSettings, setFlappyDiff } from "../../shared/settings";
import {
  FLAPPY_DIFFS,
  createFlappy,
  flap,
  flappyBestKey,
  isFlapKey,
  stepFlappy,
  type FlappyDiff,
  type FlappyState,
} from "./logic";
import "./flappy.css";

type Phase = "ready" | "running" | "over";

const MAX_STEPS = 5;

export function renderFlappy(root: HTMLElement): void {
  markPlayed("flappy");
  let difficulty = getSettings().flappyDiff;
  let best = loadJson<number>(flappyBestKey(difficulty), 0);
  let state: FlappyState | null = null;
  let phase: Phase = "ready";
  let raf = 0;
  let lastTs = 0;
  let acc = 0;

  root.innerHTML = `
    <div class="shell route-fade">
      ${renderChrome({ showBack: true })}
      <section class="panel">
        <h2>Flappy Lite</h2>
        <ol class="flappy-how">
          <li>Press the big <strong>Flap</strong> button (or Space / ↑ / W).</li>
          <li>Keep flapping so the bird stays in the air.</li>
          <li>Fly through the gaps between the pipes.</li>
        </ol>
        <div class="row flappy-diffs" role="group" aria-label="Difficulty">
          ${FLAPPY_DIFFS.map(
            (d) => `
            <button class="btn ${d === difficulty ? "btn-primary" : "btn-ghost"}" type="button" data-diff="${d}">
              ${d[0]!.toUpperCase()}${d.slice(1)}
            </button>`,
          ).join("")}
        </div>
        <div class="scoreboard">
          <span class="score-pill" data-score>Score 0</span>
          <span class="score-pill" data-best>Best ${best}</span>
        </div>
        <p class="status" data-status aria-live="polite">Press Flap to start</p>
        <div class="flappy-wrap">
          <canvas class="flappy-canvas" width="360" height="540" tabindex="0" aria-label="Flappy Lite play area"></canvas>
        </div>
        <div class="flappy-controls">
          <button class="btn btn-primary flappy-flap" type="button" data-flap>Flap</button>
          <button class="btn btn-ghost" type="button" data-again hidden>Retry run</button>
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
  const flapBtn = root.querySelector<HTMLButtonElement>("[data-flap]");

  const syncDiffButtons = (): void => {
    root.querySelectorAll<HTMLButtonElement>("[data-diff]").forEach((btn) => {
      const active = btn.dataset.diff === difficulty;
      btn.classList.toggle("btn-primary", active);
      btn.classList.toggle("btn-ghost", !active);
    });
  };

  const syncHud = (): void => {
    if (scoreEl) scoreEl.textContent = `Score ${state?.score ?? 0}`;
    if (bestEl) bestEl.textContent = `Best ${best}`;
    if (statusEl) {
      statusEl.textContent =
        phase === "ready"
          ? "Press Flap to start"
          : phase === "over"
            ? "Crashed — press Flap to retry"
            : "Keep pressing Flap!";
    }
    if (againBtn) againBtn.hidden = phase !== "over";
    if (flapBtn) {
      flapBtn.textContent =
        phase === "ready" ? "Start · Flap" : phase === "over" ? "Retry · Flap" : "Flap";
    }
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
    ctx.ellipse(bird.x, bird.y, bird.r * 1.05, bird.r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0b1f24";
    ctx.beginPath();
    ctx.arc(bird.x + 5, bird.y - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    if (phase === "ready") {
      ctx.fillStyle = "rgba(232, 244, 241, 0.92)";
      ctx.font = "700 20px Syne, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Press Flap to fly", canvas.width / 2, canvas.height * 0.58);
      ctx.font = "600 14px Outfit, sans-serif";
      ctx.fillStyle = "rgba(155, 184, 176, 0.95)";
      ctx.fillText("or Space / ↑ / W", canvas.width / 2, canvas.height * 0.64);
    }
  };

  const stopLoop = (): void => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastTs = 0;
    acc = 0;
  };

  const finish = (): void => {
    if (phase === "over") return;
    phase = "over";
    stopLoop();
    sfx.die();
    if (state && state.score > best) {
      best = state.score;
      saveJson(flappyBestKey(difficulty), best);
    }
    pushHistory("Flappy Lite", `${difficulty} · ${state?.score ?? 0}`);
    maybeCompleteDaily("flappy", state?.score ?? 0);
    syncHud();
    draw();
  };

  const frame = (ts: number): void => {
    if (phase !== "running" || !state) return;
    if (!lastTs) lastTs = ts;
    const delta = Math.min(48, ts - lastTs);
    lastTs = ts;
    acc += delta;
    let steps = 0;
    while (acc >= 16 && steps < MAX_STEPS) {
      acc -= 16;
      steps += 1;
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
    if (acc > 16 * MAX_STEPS) acc = 0;
    draw();
    syncHud();
    raf = requestAnimationFrame(frame);
  };

  const resetReady = (): void => {
    if (!canvas) return;
    stopLoop();
    state = createFlappy(canvas.width, canvas.height, difficulty);
    phase = "ready";
    syncHud();
    draw();
  };

  const beginRun = (): void => {
    if (!state || !canvas) return;
    phase = "running";
    flap(state);
    sfx.flap();
    syncHud();
    draw();
    raf = requestAnimationFrame(frame);
  };

  const retry = (): void => {
    resetReady();
    unlockAudio();
    beginRun();
  };

  const onPlayInput = (): void => {
    unlockAudio();
    if (phase === "ready") {
      beginRun();
      return;
    }
    if (phase === "over") {
      retry();
      return;
    }
    if (phase === "running" && state) {
      flap(state);
      sfx.flap();
    }
  };

  canvas?.addEventListener(
    "pointerdown",
    (e) => {
      e.preventDefault();
      canvas.focus();
      onPlayInput();
    },
    { passive: false },
  );

  flapBtn?.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    onPlayInput();
  });

  againBtn?.addEventListener("click", () => {
    sfx.tap();
    retry();
  });

  root.querySelectorAll<HTMLButtonElement>("[data-diff]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.dataset.diff as FlappyDiff;
      if (next === difficulty && phase === "ready") return;
      sfx.tap();
      difficulty = next;
      setFlappyDiff(next);
      best = loadJson<number>(flappyBestKey(difficulty), 0);
      syncDiffButtons();
      resetReady();
    });
  });

  const onKey = (e: KeyboardEvent): void => {
    if (!isFlapKey(e)) return;
    e.preventDefault();
    onPlayInput();
  };
  window.addEventListener("keydown", onKey);

  const host = root as HTMLElement & { __flappyCleanup?: () => void };
  host.__flappyCleanup?.();
  host.__flappyCleanup = () => {
    stopLoop();
    window.removeEventListener("keydown", onKey);
  };

  resetReady();
  // Prefer Easy for first-time players who somehow have no preference stored
  // already handled via settings default; focus canvas so keys work after click.
  canvas?.focus();
}
