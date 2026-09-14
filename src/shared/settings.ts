import { loadJson, saveJson } from "./storage";
import type { Route } from "./router";
import type { Speed } from "../games/snake/logic";

const KEY = "arcade-settings";

export type Settings = {
  muted: boolean;
  volume: number;
  lastGame: Exclude<Route, "hub"> | null;
  snakeSpeed: Speed;
  snakeWrap: boolean;
};

const defaults: Settings = {
  muted: false,
  volume: 0.7,
  lastGame: null,
  snakeSpeed: "normal",
  snakeWrap: false,
};

export function getSettings(): Settings {
  const raw = loadJson<Partial<Settings>>(KEY, {});
  const volume =
    typeof raw.volume === "number"
      ? Math.min(1, Math.max(0, raw.volume))
      : defaults.volume;

  const lastGame =
    raw.lastGame === "snake" ||
    raw.lastGame === "tictactoe" ||
    raw.lastGame === "rps" ||
    raw.lastGame === "memory"
      ? raw.lastGame
      : null;

  const snakeSpeed =
    raw.snakeSpeed === "chill" ||
    raw.snakeSpeed === "normal" ||
    raw.snakeSpeed === "insane"
      ? raw.snakeSpeed
      : defaults.snakeSpeed;

  return {
    muted: Boolean(raw.muted),
    volume,
    lastGame,
    snakeSpeed,
    snakeWrap: Boolean(raw.snakeWrap),
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

export function setLastGame(game: Exclude<Route, "hub">): void {
  saveJson(KEY, { ...getSettings(), lastGame: game });
}

export function setSnakePrefs(speed: Speed, wrap: boolean): void {
  saveJson(KEY, { ...getSettings(), snakeSpeed: speed, snakeWrap: wrap });
}
