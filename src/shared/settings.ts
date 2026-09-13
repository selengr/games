import { loadJson, saveJson } from "./storage";

const KEY = "arcade-settings";

export type Settings = {
  muted: boolean;
  volume: number;
};

const defaults: Settings = { muted: false, volume: 0.7 };

export function getSettings(): Settings {
  const raw = loadJson<Partial<Settings>>(KEY, {});
  const volume =
    typeof raw.volume === "number"
      ? Math.min(1, Math.max(0, raw.volume))
      : defaults.volume;
  return {
    muted: Boolean(raw.muted),
    volume,
  };
}

export function isMuted(): boolean {
  return getSettings().muted;
}

export function getVolume(): number {
  return getSettings().volume;
}

export function setMuted(muted: boolean): void {
  saveJson(KEY, { ...getSettings(), muted });
}

export function setVolume(volume: number): void {
  saveJson(KEY, {
    ...getSettings(),
    volume: Math.min(1, Math.max(0, volume)),
  });
}

export function toggleMute(): boolean {
  const muted = !isMuted();
  setMuted(muted);
  return muted;
}
