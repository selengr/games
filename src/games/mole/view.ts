import { bindChrome, renderChrome, refreshMuteButton } from "../../shared/chrome";
import { sfx, unlockAudio } from "../../shared/audio";
import { loadJson, saveJson } from "../../shared/storage";
import { checkMoleScore, markPlayed } from "../../shared/achievements";
import { announceUnlocks } from "../../shared/toast";
import { burstAtElement } from "../../shared/fx";
import { pushHistory } from "../../shared/history";
import { maybeCompleteDaily } from "../../shared/dailyComplete";
import {
  ROUND_MS,
  createHoles,
  hideExpired,
  spawnGapForScore,
  spawnMole,
  upMsForScore,
  whack,
  type Hole,
} from "./logic";
import "./mole.css";

const BEST_KEY = "arcade-mole-best";

type Phase = "running" | "over";

export function renderMole(root: HTMLElement): void {
  markPlayed("mole");
  let best = loadJson<number>(BEST_KEY, 0);
  let holes: Hole[] = createHoles();
  let score = 0;
  let streak = 0;
  let phase: Phase = "running";
  let raf = 0;
  let lastTs = 0;
  let spawnAcc = 0;
  let leftMs = ROUND_MS;

  root.innerHTML = `
    <div class="shell route-fade">
      ${renderChrome({ showBack: true })}
      <section class="panel">
        <h2>Whack-a-Mole</h2>
        <ol class="game-how">
          <li>Watch the holes — moles pop up for a short time.</li>
          <li>Tap a mole while it's up to score.</li>
          <li>You have <strong>30 seconds</strong>. Speed rises as you score.</li>
        </ol>
        <div class="scoreboard">
          <span class="score-pill" data-score>Score 0</span>
          <span class="score-pill" data-time>Time 30</span>
          <span class="score-pill" data-best>Best ${best}</span>
        </div>
        <p class="status" data-status aria-live="polite">Whack!</p>
        <div class="mole-grid" data-grid aria-label="Mole holes">
          ${holes
            .map(
              (h) => `
            <button class="mole-hole" type="button" data-hole="${h.id}" aria-label="Hole ${h.id + 1}">
              <span class="mole-face" aria-hidden="true"></span>
            </button>`,
            )
            .join("")}
        </div>
        <div class="row" style="margin-top:1rem">
          <button class="btn btn-primary" type="button" data-again hidden>Play again</button>
        </div>
      </section>
    </div>
  `;

  bindChrome(root, () => refreshMuteButton(root));

  const scoreEl = root.querySelector<HTMLElement>("[data-score]");
  const timeEl = root.querySelector<HTMLElement>("[data-time]");
  const bestEl = root.querySelector<HTMLElement>("[data-best]");
  const statusEl = root.querySelector<HTMLElement>("[data-status]");
  const againBtn = root.querySelector<HTMLButtonElement>("[data-again]");
  const holeButtons = [
    ...root.querySelectorAll<HTMLButtonElement>("[data-hole]"),
  ];

  const paintHoles = (): void => {
    for (const btn of holeButtons) {
      const id = Number(btn.dataset.hole);
      const hole = holes[id];
      btn.classList.toggle("up", Boolean(hole?.up));
    }
  };

  const syncHud = (): void => {
    if (scoreEl) scoreEl.textContent = `Score ${score}`;
    if (timeEl) timeEl.textContent = `Time ${Math.max(0, Math.ceil(leftMs / 1000))}`;
    if (bestEl) bestEl.textContent = `Best ${best}`;
    if (statusEl) {
      statusEl.textContent =
        phase === "over"
          ? `Time's up · ${score}`
          : streak >= 3
            ? `${streak} streak!`
            : "Whack!";
    }
    if (againBtn) againBtn.hidden = phase === "running";
  };

  const stop = (): void => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastTs = 0;
    spawnAcc = 0;
  };

  const finish = (): void => {
    phase = "over";
    stop();
    for (const hole of holes) {
      hole.up = false;
      hole.until = 0;
    }
    paintHoles();
    sfx.die();
    if (score > best) {
      best = score;
      saveJson(BEST_KEY, best);
    }
    pushHistory("Whack-a-Mole", `score ${score}`);
    maybeCompleteDaily("mole", score);
    syncHud();
  };

  const frame = (ts: number): void => {
    if (phase !== "running") return;
    if (!lastTs) lastTs = ts;
    const delta = ts - lastTs;
    lastTs = ts;
    leftMs -= delta;
    spawnAcc += delta;

    hideExpired(holes, ts);
    const gap = spawnGapForScore(score);
    while (spawnAcc >= gap) {
      spawnAcc -= gap;
      spawnMole(holes, ts, upMsForScore(score));
    }

    paintHoles();
    syncHud();

    if (leftMs <= 0) {
      leftMs = 0;
      finish();
      return;
    }
    raf = requestAnimationFrame(frame);
  };

  const start = (): void => {
    stop();
    holes = createHoles();
    score = 0;
    streak = 0;
    leftMs = ROUND_MS;
    phase = "running";
    paintHoles();
    syncHud();
    spawnMole(holes, performance.now(), upMsForScore(0));
    paintHoles();
    raf = requestAnimationFrame(frame);
  };

  holeButtons.forEach((btn) => {
    btn.addEventListener("pointerdown", (e) => {
      if (phase !== "running") return;
      e.preventDefault();
      unlockAudio();
      const id = Number(btn.dataset.hole);
      if (!whack(holes, id)) {
        streak = 0;
        syncHud();
        return;
      }
      streak += 1;
      score += streak >= 4 ? 2 : 1;
      sfx.eat();
      burstAtElement(btn);
      announceUnlocks(checkMoleScore(score));
      maybeCompleteDaily("mole", score);
      paintHoles();
      syncHud();
    });
  });

  againBtn?.addEventListener("click", () => {
    sfx.tap();
    start();
  });

  const host = root as HTMLElement & { __moleCleanup?: () => void };
  host.__moleCleanup?.();
  host.__moleCleanup = stop;

  start();
}
