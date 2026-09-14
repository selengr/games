export type Balloon = {
  id: number;
  x: number;
  y: number;
  r: number;
  speed: number;
  color: string;
  alive: boolean;
};

const COLORS = ["#ff6b4a", "#c8f542", "#2dd4bf", "#f472b6", "#fbbf24", "#a78bfa"];

let nextId = 1;

export function spawnBalloon(width: number, height: number): Balloon {
  const r = 18 + Math.random() * 16;
  return {
    id: nextId++,
    x: r + Math.random() * (width - r * 2),
    y: height + r + Math.random() * 40,
    r,
    speed: 1.1 + Math.random() * 1.6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    alive: true,
  };
}

export function stepBalloons(
  balloons: Balloon[],
  height: number,
): { escaped: number } {
  let escaped = 0;
  for (const b of balloons) {
    if (!b.alive) continue;
    b.y -= b.speed;
    if (b.y + b.r < 0) {
      b.alive = false;
      escaped += 1;
    }
  }
  return { escaped };
}

export function hitBalloon(
  balloons: Balloon[],
  x: number,
  y: number,
): Balloon | null {
  for (let i = balloons.length - 1; i >= 0; i -= 1) {
    const b = balloons[i]!;
    if (!b.alive) continue;
    const dx = b.x - x;
    const dy = b.y - y;
    if (dx * dx + dy * dy <= b.r * b.r) {
      b.alive = false;
      return b;
    }
  }
  return null;
}
