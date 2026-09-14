import { loadJson } from "./storage";
import { flappyBestKey, type FlappyDiff } from "../games/flappy/logic";

export type HubBest = {
  label: string;
  value: string;
};

function flappyBest(): number {
  const diffs: FlappyDiff[] = ["easy", "normal", "hard"];
  return Math.max(
    0,
    ...diffs.map((d) => loadJson<number>(flappyBestKey(d), 0)),
    loadJson<number>("arcade-flappy-best", 0),
  );
}

function snakeBest(): number {
  return Math.max(
    loadJson<number>("arcade-snake-best", 0),
    loadJson<number>("arcade-snake-best-chill", 0),
    loadJson<number>("arcade-snake-best-normal", 0),
    loadJson<number>("arcade-snake-best-insane", 0),
  );
}

function memoryBest(): string | null {
  const candidates = [
    loadJson<{ moves: number } | null>("arcade-memory-best-normal", null),
    loadJson<{ moves: number } | null>("arcade-memory-best-v2", null),
    loadJson<{ moves: number } | null>("arcade-memory-best-small", null),
    loadJson<{ moves: number } | null>("arcade-memory-best-large", null),
  ].filter(Boolean) as Array<{ moves: number }>;
  if (!candidates.length) return null;
  const best = candidates.sort((a, b) => a.moves - b.moves)[0]!;
  return `${best.moves} moves`;
}

/** Compact personal bests for the hub strip. */
export function getHubBests(): HubBest[] {
  const ttt = loadJson<{ wins: number }>("arcade-ttt-scores", { wins: 0 });
  const items: HubBest[] = [];

  const snake = snakeBest();
  if (snake > 0) items.push({ label: "Snake", value: String(snake) });

  const flappy = flappyBest();
  if (flappy > 0) items.push({ label: "Flappy", value: String(flappy) });

  const breakout = loadJson<number>("arcade-breakout-best", 0);
  if (breakout > 0) items.push({ label: "Breakout", value: String(breakout) });

  const balloons = loadJson<number>("arcade-balloons-best", 0);
  if (balloons > 0) items.push({ label: "Balloons", value: String(balloons) });

  const mole = loadJson<number>("arcade-mole-best", 0);
  if (mole > 0) items.push({ label: "Mole", value: String(mole) });

  const reaction = loadJson<number>("arcade-reaction-best", 0);
  if (reaction > 0) items.push({ label: "Reaction", value: `${reaction}W` });

  if (ttt.wins > 0) items.push({ label: "TTT", value: `${ttt.wins}W` });

  const memory = memoryBest();
  if (memory) items.push({ label: "Memory", value: memory });

  return items;
}
