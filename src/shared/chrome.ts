import { setRoute } from "./router";
import { toggleMute, isMuted } from "./settings";
import { unlockAudio, sfx } from "./audio";

export function renderChrome(opts: { showBack?: boolean }): string {
  const muted = isMuted();
  return `
    <div class="brand-bar">
      <p class="brand">Arcade Hub</p>
      <div class="chrome-actions">
        <button class="icon-btn" type="button" data-mute aria-pressed="${muted}">
          ${muted ? "Sound off" : "Sound"}
        </button>
        ${
          opts.showBack
            ? `<button class="back-btn" type="button" data-back>Back</button>`
            : ""
        }
      </div>
    </div>
  `;
}

export function bindChrome(root: HTMLElement, onChange?: () => void): void {
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
}
