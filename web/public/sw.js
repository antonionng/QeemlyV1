/* eslint-disable no-restricted-globals */
// Safe no-op service worker. This replaces any stale worker script that may
// intercept fetches and throw runtime errors in development.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
