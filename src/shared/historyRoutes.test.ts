import { describe, expect, it } from "vitest";
import { routeFromHistoryTitle } from "./historyRoutes";

describe("historyRoutes", () => {
  it("maps known titles to routes", () => {
    expect(routeFromHistoryTitle("Flappy Lite")).toBe("flappy");
    expect(routeFromHistoryTitle("Snake")).toBe("snake");
  });

  it("returns null for unknown titles", () => {
    expect(routeFromHistoryTitle("RPS")).toBeNull();
  });
});
