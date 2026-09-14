import "./styles/global.css";
import { renderHub } from "./hub/hub";
import { renderTicTacToe } from "./games/tictactoe/view";
import { renderMemory } from "./games/memory/view";
import { renderSnake } from "./games/snake/view";
import { renderBreakout } from "./games/breakout/view";
import { renderBalloons } from "./games/balloons/view";
import { renderMole } from "./games/mole/view";
import { renderReaction } from "./games/reaction/view";
import { renderFlappy } from "./games/flappy/view";
import { parseRoute } from "./shared/router";
import { registerOffline } from "./shared/offline";

const rootEl = document.querySelector<HTMLDivElement>("#app");
if (!rootEl) {
  throw new Error("Missing #app root");
}
const app: HTMLElement = rootEl;

type CleanupHost = HTMLElement & {
  __snakeCleanup?: () => void;
  __tttCleanup?: () => void;
  __memoryCleanup?: () => void;
  __breakoutCleanup?: () => void;
  __balloonsCleanup?: () => void;
  __moleCleanup?: () => void;
  __reactionCleanup?: () => void;
  __flappyCleanup?: () => void;
};

function cleanup(): void {
  const host = app as CleanupHost;
  host.__snakeCleanup?.();
  host.__tttCleanup?.();
  host.__memoryCleanup?.();
  host.__breakoutCleanup?.();
  host.__balloonsCleanup?.();
  host.__moleCleanup?.();
  host.__reactionCleanup?.();
  host.__flappyCleanup?.();
  host.__snakeCleanup = undefined;
  host.__tttCleanup = undefined;
  host.__memoryCleanup = undefined;
  host.__breakoutCleanup = undefined;
  host.__balloonsCleanup = undefined;
  host.__moleCleanup = undefined;
  host.__reactionCleanup = undefined;
  host.__flappyCleanup = undefined;
}

function render(): void {
  cleanup();
  const route = parseRoute(window.location.hash);
  if (route === "snake") renderSnake(app);
  else if (route === "breakout") renderBreakout(app);
  else if (route === "balloons") renderBalloons(app);
  else if (route === "mole") renderMole(app);
  else if (route === "reaction") renderReaction(app);
  else if (route === "flappy") renderFlappy(app);
  else if (route === "tictactoe") renderTicTacToe(app);
  else if (route === "memory") renderMemory(app);
  else renderHub(app);
}

window.addEventListener("hashchange", render);
render();
registerOffline();
