import { ACHIEVEMENTS, type AchievementId } from "./achievements";

export function toast(message: string): void {
  document.querySelectorAll(".toast").forEach((el) => el.remove());
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 2200);
}

export function announceUnlocks(ids: AchievementId[]): void {
  for (const id of ids) {
    const item = ACHIEVEMENTS.find((a) => a.id === id);
    if (item) toast(`Unlocked: ${item.title}`);
  }
}
