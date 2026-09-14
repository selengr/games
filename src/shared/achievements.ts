import { loadJson, saveJson } from "./storage";

const KEY = "arcade-achievements";
const PLAYED_KEY = "arcade-played";

export type AchievementId =
  | "first_bite"
  | "snake_10"
  | "snake_25"
  | "ttt_win"
  | "ttt_hard"
  | "rps_streak"
  | "memory_clear"
  | "memory_large"
  | "tour_all";

export type Achievement = {
  id: AchievementId;
  title: string;
  detail: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_bite", title: "First bite", detail: "Score at least 1 in Snake" },
  { id: "snake_10", title: "Getting long", detail: "Reach 10 in Snake" },
  { id: "snake_25", title: "Snake boss", detail: "Reach 25 in Snake" },
  { id: "ttt_win", title: "Outsmarted", detail: "Beat the Tic-Tac-Toe AI" },
  { id: "ttt_hard", title: "No mercy", detail: "Beat hard-mode AI" },
  { id: "rps_streak", title: "On a roll", detail: "Hit a 5-win RPS streak" },
  { id: "memory_clear", title: "Sharp mind", detail: "Clear a Memory board" },
  { id: "memory_large", title: "Full house", detail: "Clear the large Memory board" },
  { id: "tour_all", title: "Tour complete", detail: "Open every game once" },
];

type Store = Partial<Record<AchievementId, number>>;

function read(): Store {
  return loadJson<Store>(KEY, {});
}

export function unlockedIds(): AchievementId[] {
  return Object.keys(read()) as AchievementId[];
}

export function isUnlocked(id: AchievementId): boolean {
  return Boolean(read()[id]);
}

export function unlock(id: AchievementId): boolean {
  const store = read();
  if (store[id]) return false;
  store[id] = Date.now();
  saveJson(KEY, store);
  return true;
}

export function markPlayed(game: "snake" | "tictactoe" | "rps" | "memory"): void {
  const played = loadJson<Record<string, boolean>>(PLAYED_KEY, {});
  played[game] = true;
  saveJson(PLAYED_KEY, played);
  if (played.snake && played.tictactoe && played.rps && played.memory) {
    unlock("tour_all");
  }
}

export function clearAchievements(): void {
  saveJson(KEY, {});
  saveJson(PLAYED_KEY, {});
}

export function checkSnakeScore(score: number): AchievementId[] {
  const got: AchievementId[] = [];
  if (score >= 1 && unlock("first_bite")) got.push("first_bite");
  if (score >= 10 && unlock("snake_10")) got.push("snake_10");
  if (score >= 25 && unlock("snake_25")) got.push("snake_25");
  return got;
}

export function checkTttWin(hard: boolean): AchievementId[] {
  const got: AchievementId[] = [];
  if (unlock("ttt_win")) got.push("ttt_win");
  if (hard && unlock("ttt_hard")) got.push("ttt_hard");
  return got;
}

export function checkRpsStreak(streak: number): AchievementId[] {
  if (streak >= 5 && unlock("rps_streak")) return ["rps_streak"];
  return [];
}

export function checkMemoryClear(large: boolean): AchievementId[] {
  const got: AchievementId[] = [];
  if (unlock("memory_clear")) got.push("memory_clear");
  if (large && unlock("memory_large")) got.push("memory_large");
  return got;
}
