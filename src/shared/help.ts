export type HelpContent = {
  title: string;
  steps: string[];
};

const HELP: Record<string, HelpContent> = {
  snake: {
    title: "How to play Snake",
    steps: [
      "Move with arrows, WASD, swipe, or the on-screen pad.",
      "Eat the coral dots to grow and score.",
      "Hit a wall or yourself and it's over — unless wrap is on.",
      "Space pauses. Pick chill / normal / insane for speed.",
    ],
  },
  tictactoe: {
    title: "How to play Tic-Tac-Toe",
    steps: [
      "Get three in a row — horizontal, vertical, or diagonal.",
      "Vs AI: you are X. Hard mode never loses if it plays perfectly.",
      "Vs friend: pass the device; X goes first.",
      "Number keys 1–9 pick cells (top-left is 1).",
    ],
  },
  rps: {
    title: "How to play Rock Paper Scissors",
    steps: [
      "Rock beats scissors, scissors beat paper, paper beats rock.",
      "First to three round wins takes the match.",
      "Streaks and career stats save on this device.",
    ],
  },
  memory: {
    title: "How to play Memory",
    steps: [
      "Flip two cards. Matching pairs stay up.",
      "Clear the board in as few moves and as little time as you can.",
      "Small / normal / large change how many pairs you get.",
      "Best scores are saved per board size.",
    ],
  },
};

export function getHelp(game: keyof typeof HELP): HelpContent {
  return HELP[game];
}

export function openHelpModal(root: HTMLElement, game: keyof typeof HELP): void {
  const existing = root.querySelector("[data-help-modal]");
  existing?.remove();

  const help = getHelp(game);
  const modal = document.createElement("div");
  modal.className = "help-modal";
  modal.setAttribute("data-help-modal", "");
  modal.innerHTML = `
    <div class="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <h3 id="help-title">${help.title}</h3>
      <ol>
        ${help.steps.map((step) => `<li>${step}</li>`).join("")}
      </ol>
      <button class="btn btn-primary" type="button" data-help-close>Got it</button>
    </div>
  `;

  const close = (): void => {
    window.removeEventListener("keydown", onKey);
    modal.remove();
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  modal.querySelector("[data-help-close]")?.addEventListener("click", close);
  window.addEventListener("keydown", onKey);
  root.appendChild(modal);
  modal.querySelector<HTMLButtonElement>("[data-help-close]")?.focus();
}
