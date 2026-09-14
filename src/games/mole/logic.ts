export type Hole = {
  id: number;
  up: boolean;
  until: number;
};

export const HOLE_COUNT = 9;
export const ROUND_MS = 30_000;

export function createHoles(count = HOLE_COUNT): Hole[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    up: false,
    until: 0,
  }));
}

export function hideExpired(holes: Hole[], now: number): number {
  let missed = 0;
  for (const hole of holes) {
    if (hole.up && now >= hole.until) {
      hole.up = false;
      hole.until = 0;
      missed += 1;
    }
  }
  return missed;
}

export function spawnMole(
  holes: Hole[],
  now: number,
  upMs: number,
): Hole | null {
  const down = holes.filter((h) => !h.up);
  if (!down.length) return null;
  const hole = down[Math.floor(Math.random() * down.length)]!;
  hole.up = true;
  hole.until = now + upMs;
  return hole;
}

export function whack(holes: Hole[], id: number): boolean {
  const hole = holes[id];
  if (!hole || !hole.up) return false;
  hole.up = false;
  hole.until = 0;
  return true;
}

export function upMsForScore(score: number): number {
  return Math.max(520, 1100 - score * 18);
}

export function spawnGapForScore(score: number): number {
  return Math.max(380, 820 - score * 12);
}
