import { unlock } from "./achievements";
import { tryCompleteDaily, type DailyGame } from "./daily";
import { announceUnlocks, toast } from "./toast";

export function maybeCompleteDaily(game: DailyGame, value: number): void {
  if (!tryCompleteDaily(game, value)) return;
  const fresh = unlock("daily_clear");
  toast("Daily challenge complete!");
  if (fresh) announceUnlocks(["daily_clear"]);
}
