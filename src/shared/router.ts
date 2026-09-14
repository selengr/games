export type Route =
  | "hub"
  | "tictactoe"
  | "rps"
  | "memory"
  | "snake"
  | "breakout"
  | "balloons"
  | "mole"
  | "reaction";

const routes: Route[] = [
  "hub",
  "tictactoe",
  "rps",
  "memory",
  "snake",
  "breakout",
  "balloons",
  "mole",
  "reaction",
];

export function parseRoute(hash: string): Route {
  const value = hash.replace(/^#\/?/, "").toLowerCase();
  if ((routes as string[]).includes(value) && value !== "hub") {
    return value as Route;
  }
  return "hub";
}

export function setRoute(route: Route): void {
  window.location.hash = route === "hub" ? "" : `#/${route}`;
}
