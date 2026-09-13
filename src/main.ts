import "./styles/global.css";
import { renderHub } from "./hub/hub";
import { renderTicTacToe } from "./games/tictactoe/view";
import { renderRps } from "./games/rps/view";
import { renderMemory } from "./games/memory/view";
import { renderSnake } from "./games/snake/view";
import { parseRoute } from "./shared/router";

const rootEl = document.querySelector<HTMLDivElement>("#app");
if (!rootEl) {
  throw new Error("Missing #app root");
}
const app: HTMLElement = rootEl;

type CleanupHost = HTMLElement & {
  __snakeCleanup?: () => void;
  __tttCleanup?: () => void;
  __memoryCleanup?: () => void;
};

function cleanup(): void {
  const host = app as CleanupHost;
  host.__snakeCleanup?.();
  host.__tttCleanup?.();
  host.__memoryCleanup?.();
  host.__snakeCleanup = undefined;
  host.__tttCleanup = undefined;
  host.__memoryCleanup = undefined;
}

function render(): void {
  cleanup();
  const route = parseRoute(window.location.hash);
  if (route === "snake") renderSnake(app);
  else if (route === "tictactoe") renderTicTacToe(app);
  else if (route === "rps") renderRps(app);
  else if (route === "memory") renderMemory(app);
  else renderHub(app);
}

window.addEventListener("hashchange", render);
render();
