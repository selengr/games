import { loadJson, saveJson } from "./storage";

const DISMISS_KEY = "arcade-install-tip-dismissed";

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return Boolean(nav.standalone);
}

export function isInstallTipDismissed(): boolean {
  return loadJson<boolean>(DISMISS_KEY, false);
}

export function dismissInstallTip(): void {
  saveJson(DISMISS_KEY, true);
}

export function shouldShowInstallTip(): boolean {
  return !isStandaloneDisplay() && !isInstallTipDismissed();
}
