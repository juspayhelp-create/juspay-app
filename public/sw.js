self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CRITICAL: NEVER cache or intercept API endpoints, auth routes, or mutation requests
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/.well-known') ||
    event.request.method !== 'GET' ||
    event.request.headers.has('Authorization')
  ) {
    return; // Pass directly to network
  }

  // Only cache static frontend assets
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

