export type Route = "hub" | "tictactoe" | "rps" | "memory";

export function parseRoute(hash: string): Route {
  const value = hash.replace(/^#\/?/, "").toLowerCase();
  if (value === "tictactoe" || value === "rps" || value === "memory") {
    return value;
  }
  return "hub";
}

export function setRoute(route: Route): void {
  window.location.hash = route === "hub" ? "" : `#/${route}`;
}
