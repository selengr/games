import { bindChrome, renderChrome, refreshMuteButton } from "../../shared/chrome";
import { sfx, unlockAudio } from "../../shared/audio";
import { loadJson, saveJson } from "../../shared/storage";
import { checkReactionWin, markPlayed } from "../../shared/achievements";
import { announceUnlocks } from "../../shared/toast";
import { burstAtElement } from "../../shared/fx";
import { pushHistory } from "../../shared/history";
import { maybeCompleteDaily } from "../../shared/dailyComplete";
import {
  applyRound,
  createMatch,
  judgeTap,
  rivalDelayMs,
  waitDelayMs,
  type MatchState,
  type Phase,
} from "./logic";
import "./reaction.css";

const BEST_KEY = "arcade-reaction-best";

export function renderReaction(root: HTMLElement): void {
  markPlayed("reaction");
  let best = loadJson<number>(BEST_KEY, 0);
  let match: MatchState = createMatch();
  let phase: Phase = "wait";
  let goAt = 0;
  let rivalAt = 0;
  let waitTimer = 0;
  let rivalTimer = 0;
  let lastMsg = "Wait for green…";
  let lastMs: number | null = null;

  const clearTimers = (): void => {
    if (waitTimer) window.clearTimeout(waitTimer);
    if (rivalTimer) window.clearTimeout(rivalTimer);
    waitTimer = 0;
    rivalTimer = 0;
  };

  const paint = (): void => {
    const signal =
      phase === "wait"
        ? "WAIT"
        : phase === "go"
          ? "GO!"
          : phase === "false"
            ? "Too soon"
            : phase === "match"
              ? match.you > match.rival
                ? "You win!"
                : "Rival wins"
              : lastMsg;

    const sub =
      phase === "wait"
        ? "Don't tap yet"
        : phase === "go"
          ? "Tap now!"
          : phase === "false"
            ? "False start — rival scores"
            : phase === "match"
              ? `Final ${match.you}–${match.rival}`
              : lastMs != null
                ? `Your time ${lastMs}ms`
                : "Tap to continue";

    root.innerHTML = `
      <div class="shell route-fade">
        ${renderChrome({ showBack: true })}
        <section class="panel">
          <h2>Reaction Duel</h2>
          <p class="hint">Wait for GO, then tap faster than the rival. First to 5.</p>
          <div class="scoreboard">
            <span class="score-pill" data-you>You ${match.you}</span>
            <span class="score-pill" data-rival>Rival ${match.rival}</span>
            <span class="score-pill">Best ${best}</span>
          </div>
          <p class="status" aria-live="polite">${
            phase === "match" ? "Match over" : "First to 5"
          }</p>
          <button class="reaction-arena ${phase}" type="button" data-arena aria-label="Reaction arena">
            <p class="reaction-signal">${signal}</p>
            <p class="reaction-sub">${sub}</p>
          </button>
          <div class="row" style="margin-top:1rem">
            <button class="btn btn-primary" type="button" data-again ${
              phase === "match" ? "" : "hidden"
            }>Play again</button>
          </div>
        </section>
      </div>
    `;

    bindChrome(root, () => refreshMuteButton(root));
    wire();
  };

  const finishMatch = (winner: "you" | "rival"): void => {
    phase = "match";
    clearTimers();
    if (winner === "you") {
      sfx.win();
      burstAtElement(root.querySelector("[data-arena]"));
      best += 1;
      saveJson(BEST_KEY, best);
      announceUnlocks(checkReactionWin());
      maybeCompleteDaily("reaction", 1);
      pushHistory("Reaction Duel", `won ${match.you}–${match.rival}`);
    } else {
      sfx.die();
      pushHistory("Reaction Duel", `lost ${match.you}–${match.rival}`);
    }
    paint();
  };

  const endRound = (result: ReturnType<typeof judgeTap>, playerMs?: number): void => {
    clearTimers();
    lastMs = playerMs ?? null;
    if (result === "win") {
      lastMsg = "You were faster!";
      sfx.eat();
    } else if (result === "false") {
      lastMsg = "False start";
      sfx.lose();
    } else {
      lastMsg = "Rival was faster";
      sfx.lose();
    }
    const step = applyRound(match, result);
    match = step.match;
    if (step.over && step.winner) {
      finishMatch(step.winner);
      return;
    }
    phase = "result";
    paint();
  };

  const armRound = (): void => {
    clearTimers();
    phase = "wait";
    lastMs = null;
    lastMsg = "Wait for green…";
    paint();
    const delay = waitDelayMs();
    waitTimer = window.setTimeout(() => {
      phase = "go";
      goAt = performance.now();
      rivalAt = rivalDelayMs();
      paint();
      rivalTimer = window.setTimeout(() => {
        if (phase !== "go") return;
        endRound("lose");
      }, rivalAt);
    }, delay);
  };

  const onTap = (): void => {
    unlockAudio();
    if (phase === "match") return;
    if (phase === "result" || phase === "false") {
      sfx.tap();
      armRound();
      return;
    }
    if (phase === "wait") {
      endRound("false");
      return;
    }
    if (phase === "go") {
      const playerMs = Math.round(performance.now() - goAt);
      endRound(judgeTap("go", playerMs, rivalAt), playerMs);
    }
  };

  const wire = (): void => {
    root.querySelector("[data-arena]")?.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      onTap();
    });
    root.querySelector("[data-again]")?.addEventListener("click", () => {
      sfx.tap();
      match = createMatch();
      armRound();
    });
  };

  const host = root as HTMLElement & { __reactionCleanup?: () => void };
  host.__reactionCleanup?.();
  host.__reactionCleanup = clearTimers;

  armRound();
}
