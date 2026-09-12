import "./styles/global.css";
import { renderHub } from "./hub/hub";
import { renderTicTacToe } from "./games/tictactoe/view";
import { renderRps } from "./games/rps/view";
import { renderMemory } from "./games/memory/view";
import { parseRoute } from "./shared/router";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root");
}

function render(): void {
  const route = parseRoute(window.location.hash);
  if (route === "tictactoe") renderTicTacToe(app);
  else if (route === "rps") renderRps(app);
  else if (route === "memory") renderMemory(app);
  else renderHub(app);
}

window.addEventListener("hashchange", render);
render();
