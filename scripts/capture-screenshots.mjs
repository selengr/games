import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "docs", "screenshots");
const base = process.env.SHOT_BASE ?? "http://127.0.0.1:4173/arcade-hub/";

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

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 900, height: 1200 },
  deviceScaleFactor: 2,
});

for (const shot of shots) {
  const url = `${base}${shot.hash}`;
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  // Pause auto-running games briefly so the frame is readable
  if (shot.name === "snake") {
    // leave ready/start UI visible
  }
  if (shot.name === "flappy") {
    // ready state is ideal
  }
  const path = join(outDir, `${shot.name}.png`);
  await page.screenshot({ path, fullPage: true });
  console.log("wrote", path);
}

await browser.close();
