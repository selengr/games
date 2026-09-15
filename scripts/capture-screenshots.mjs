import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "docs", "screenshots");
const base = process.env.SHOT_BASE ?? "http://127.0.0.1:4173/arcade-hub/";
const chrome =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const shots = [
  { name: "hub", hash: "" },
  { name: "snake", hash: "#/snake" },
  { name: "flappy", hash: "#/flappy" },
  { name: "breakout", hash: "#/breakout" },
  { name: "balloons", hash: "#/balloons" },
  { name: "mole", hash: "#/mole" },
  { name: "reaction", hash: "#/reaction" },
  { name: "tictactoe", hash: "#/tictactoe" },
  { name: "memory", hash: "#/memory" },
];

await mkdir(outDir, { recursive: true });

for (const shot of shots) {
  const path = join(outDir, `${shot.name}.png`);
  const url = `${base}${shot.hash}`;
  const result = spawnSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--window-size=900,1400",
      "--virtual-time-budget=3000",
      `--screenshot=${path}`,
      url,
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
  console.log("wrote", path);
}
