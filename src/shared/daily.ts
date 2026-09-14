import { loadJson, saveJson, removeJson } from "./storage";
import type { Route } from "./router";

export type DailyGame = Exclude<Route, "hub">;

export type DailyChallenge = {
  date: string;
  game: DailyGame;
  title: string;
  detail: string;
  target: number;
};

type DailySave = {
  date: string;
  done: boolean;
  value?: number;
};

const DONE_KEY = "arcade-daily";
const ACTIVE_KEY = "arcade-daily-active";

const TITLES: Record<DailyGame, string> = {
  snake: "Snake sprint",
  memory: "Memory dash",
  rps: "RPS match",
  tictactoe: "Beat the AI",
};

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function dayIndex(date = todayKey()): number {
  let hash = 0;
  for (let i = 0; i < date.length; i += 1) {
    hash = (hash * 31 + date.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getDailyChallenge(date = todayKey()): DailyChallenge {
  const games: DailyGame[] = ["snake", "memory", "rps", "tictactoe"];
  const idx = dayIndex(date) % games.length;
  const game = games[idx]!;
  const target =
    game === "snake"
      ? 8 + (dayIndex(date) % 10)
      : game === "memory"
        ? 18 + (dayIndex(date) % 8)
        : game === "rps"
          ? 1
          : 1;

  const detail =
    game === "snake"
      ? `Score at least ${target} in one run.`
      : game === "memory"
        ? `Clear a normal board in ${target} moves or fewer.`
        : game === "rps"
          ? "Win one first-to-three match."
          : "Win a round against the AI (any difficulty).";

  return {
    date,
    game,
    title: TITLES[game],
    detail,
    target,
  };
}

export function getDailySave(): DailySave {
  const save = loadJson<DailySave | null>(DONE_KEY, null);
  const today = todayKey();
  if (!save || save.date !== today) {
    return { date: today, done: false };
  }
  return save;
}

export function isDailyDone(): boolean {
  return getDailySave().done;
}

export function markDailyDone(value?: number): boolean {
  const today = todayKey();
  const save = getDailySave();
  if (save.date === today && save.done) return false;
  saveJson(DONE_KEY, { date: today, done: true, value });
  return true;
}

export function startDailyRun(): DailyChallenge {
  const challenge = getDailyChallenge();
  saveJson(ACTIVE_KEY, { date: challenge.date, game: challenge.game });
  return challenge;
}

export function getActiveDaily(): { date: string; game: DailyGame } | null {
  const active = loadJson<{ date: string; game: DailyGame } | null>(
    ACTIVE_KEY,
    null,
  );
  if (!active || active.date !== todayKey()) return null;
  return active;
}

export function clearActiveDaily(): void {
  removeJson(ACTIVE_KEY);
}

export function tryCompleteDaily(
  game: DailyGame,
  value: number,
): boolean {
  const active = getActiveDaily();
  const challenge = getDailyChallenge();
  if (!active || active.game !== game || active.game !== challenge.game) {
    return false;
  }
  const ok =
    game === "snake"
      ? value >= challenge.target
      : game === "memory"
        ? value <= challenge.target
        : value >= challenge.target;

  if (!ok) return false;
  clearActiveDaily();
  return markDailyDone(value);
}
