import { setRoute } from "./router";
import { toggleMute, isMuted, getVolume, setVolume } from "./settings";
import { unlockAudio, sfx } from "./audio";
import { openHelpModal } from "./help";

export function renderChrome(opts: {
  title?: string;
  showBack?: boolean;
  showVolume?: boolean;
  helpGame?: "snake" | "tictactoe" | "rps" | "memory";
}): string {
  const muted = isMuted();
  const volume = Math.round(getVolume() * 100);
  return `
    <div class="brand-bar">
      <p class="brand">Arcade Hub</p>
      <div class="chrome-actions">
        ${
          opts.helpGame
            ? `<button class="icon-btn" type="button" data-help>Help</button>`
            : ""
        }
        <button class="icon-btn" type="button" data-mute aria-pressed="${muted}" title="${muted ? "Unmute" : "Mute"}">
          ${muted ? "Sound off" : "Sound on"}
        </button>
        ${
          opts.showVolume !== false
            ? `<label class="vol-control">
                <span class="sr-only">Volume</span>
                <input data-volume type="range" min="0" max="100" value="${volume}" aria-label="Volume" />
              </label>`
            : ""
        }
        ${
          opts.showBack
            ? `<button class="back-btn" type="button" data-back>← Games</button>`
            : ""
        }
      </div>
    </div>
  `;
}

export function bindChrome(
  root: HTMLElement,
  onChange?: () => void,
  helpGame?: "snake" | "tictactoe" | "rps" | "memory",
): void {
  root.querySelector("[data-back]")?.addEventListener("click", () => {
    sfx.tap();
    setRoute("hub");
  });

  root.querySelector("[data-mute]")?.addEventListener("click", () => {
    unlockAudio();
    toggleMute();
    sfx.tap();
    onChange?.();
  });

  root.querySelector<HTMLInputElement>("[data-volume]")?.addEventListener("input", (e) => {
    unlockAudio();
    const value = Number((e.target as HTMLInputElement).value) / 100;
    setVolume(value);
    sfx.tap();
  });

  root.querySelector("[data-help]")?.addEventListener("click", () => {
    sfx.tap();
    if (helpGame) openHelpModal(root, helpGame);
  });
}
