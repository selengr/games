import { loadJson, saveJson } from "./storage";

const KEY = "arcade-settings";

export type Settings = {
  muted: boolean;
};

const defaults: Settings = { muted: false };

export function getSettings(): Settings {
  return { ...defaults, ...loadJson<Partial<Settings>>(KEY, {}) };
}

export function isMuted(): boolean {
  return getSettings().muted;
}

export function setMuted(muted: boolean): void {
  const next = { ...getSettings(), muted };
  saveJson(KEY, next);
}

export function toggleMute(): boolean {
  const muted = !isMuted();
  setMuted(muted);
  return muted;
}
