import { loadJson, saveJson, removeJson } from "./storage";

export type HistoryEntry = {
  at: number;
  game: string;
  summary: string;
};

const KEY = "arcade-history";
const LIMIT = 12;

export function getHistory(): HistoryEntry[] {
  return loadJson<HistoryEntry[]>(KEY, []);
}

export function pushHistory(game: string, summary: string): void {
  const next = [{ at: Date.now(), game, summary }, ...getHistory()].slice(
    0,
    LIMIT,
  );
  saveJson(KEY, next);
}

export function clearHistory(): void {
  removeJson(KEY);
}

export function formatWhen(at: number): string {
  const diff = Date.now() - at;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
