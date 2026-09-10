// Minimal service worker: just enough to satisfy "Add to Home Screen"
// installability. No offline caching — the feed/chat data is live and
// changes constantly, so caching it would just serve stale content.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Always go to the network; this handler's only job is to exist.
});
