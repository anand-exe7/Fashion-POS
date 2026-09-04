/*
 * Daddy's Home POS — service worker.
 *
 * DELIBERATELY NETWORK-ONLY. It caches nothing.
 *
 * Its only job is to satisfy the browser's installability requirement (a
 * registered worker with a fetch handler) so the POS can be installed to a
 * home screen and run without browser chrome.
 *
 * Caching is intentionally not implemented: this is a billing terminal. A
 * stale cached product price, a stale invoice total, or a save that silently
 * queues offline and never lands would be worse than a visible failure.
 * Real offline billing needs a local invoice queue with sync-on-reconnect —
 * a feature in its own right, not a caching layer.
 */

self.addEventListener("install", () => {
  // No precache to build, so take over immediately.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Clear anything a previous worker version may have stored.
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  // Pass straight through to the network. Present so the app is installable,
  // but never intercepting or serving stale data.
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request));
});

// Allows a future version to be activated without waiting for all tabs to close.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
