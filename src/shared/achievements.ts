import { loadJson, saveJson } from "./storage";
import { setLastGame } from "./settings";

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
  | "tour_all"
  | "daily_clear"
  | "breakout_clear"
  | "balloons_20"
  | "mole_15"
  | "reaction_win"
  | "flappy_5";

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
  { id: "breakout_clear", title: "Brick breaker", detail: "Clear a Breakout level" },
  { id: "balloons_20", title: "Pop star", detail: "Pop 20 balloons in one run" },
  { id: "mole_15", title: "Quick hands", detail: "Score 15 in Whack-a-Mole" },
  { id: "reaction_win", title: "Lightning", detail: "Win a Reaction Duel match" },
  { id: "flappy_5", title: "Sky lanes", detail: "Clear 5 pipes in Flappy Lite" },
  { id: "tour_all", title: "Tour complete", detail: "Open every game once" },
  { id: "daily_clear", title: "Daily grind", detail: "Finish today's challenge" },
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

export function markPlayed(
  game:
    | "snake"
    | "tictactoe"
    | "rps"
    | "memory"
    | "breakout"
    | "balloons"
    | "mole"
    | "reaction"
    | "flappy",
): void {
  setLastGame(game);
  const played = loadJson<Record<string, boolean>>(PLAYED_KEY, {});
  played[game] = true;
  saveJson(PLAYED_KEY, played);
  if (
    played.snake &&
    played.tictactoe &&
    played.rps &&
    played.memory &&
    played.breakout &&
    played.balloons &&
    played.mole &&
    played.reaction &&
    played.flappy
  ) {
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

export function checkBreakoutClear(): AchievementId[] {
  if (unlock("breakout_clear")) return ["breakout_clear"];
  return [];
}

export function checkBalloonsScore(score: number): AchievementId[] {
  if (score >= 20 && unlock("balloons_20")) return ["balloons_20"];
  return [];
}

export function checkMoleScore(score: number): AchievementId[] {
  if (score >= 15 && unlock("mole_15")) return ["mole_15"];
  return [];
}

export function checkReactionWin(): AchievementId[] {
  if (unlock("reaction_win")) return ["reaction_win"];
  return [];
}

export function checkFlappyScore(score: number): AchievementId[] {
  if (score >= 5 && unlock("flappy_5")) return ["flappy_5"];
  return [];
}
