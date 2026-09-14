export function registerOffline(): void {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    const url = `${import.meta.env.BASE_URL}sw.js`;
    void navigator.serviceWorker.register(url).catch(() => {
      // offline support is optional
    });
  });
}
