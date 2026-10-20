// Service worker for the AlNaimi Real Estate PWA.
//
// Rules that matter here:
//  - Only the app shell is cached. API calls, Firebase Auth and Firestore are
//    always network-only, so a cached build can never serve stale bookings,
//    stale prices or replay a session.
//  - Navigations use network-first so a fresh deployment is picked up, with the
//    cached shell as an offline fallback.
//  - The cache name carries a version. Bump SW_VERSION on every deploy and the
//    worker deletes the older caches on activate, which is what pushes security
//    fixes out to already-installed apps.

const SW_VERSION = "v1";
const SHELL_CACHE = `alnaimi-shell-${SW_VERSION}`;
const ASSET_CACHE = `alnaimi-assets-${SW_VERSION}`;

// Never cache these prefixes, whatever the request looks like.
// /api-proxy/ carries Firebase Auth tokens and Firestore documents: caching it
// would replay credentials and serve stale bookings. It does not start with
// "/api/" so it must be listed on its own.
const NEVER_CACHE = [
  "/api/",
  "/api-proxy/",
  "/__",
  "firestore.googleapis.com",
  "identitytoolkit",
  "securetoken",
  "firebaseinstallations",
  "firebaseremoteconfig",
];

const PRECACHE = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // addAll is atomic: one 404 would leave the app with no offline shell,
      // so tolerate individual failures.
      .then((cache) => Promise.allSettled(PRECACHE.map((u) => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("alnaimi-") && !k.endsWith(SW_VERSION)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isCacheable(url) {
  if (url.origin !== self.location.origin) return false;
  return !NEVER_CACHE.some((p) => url.pathname.startsWith(p) || url.href.includes(p));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (!isCacheable(url)) return; // straight to the network, never stored

  // Navigations: try the network so deploys land, fall back to the cached shell.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(SHELL_CACHE);
          cache.put("/", fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match("/");
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Build assets are content-hashed, so cache-first is safe and fast.
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.ok && (url.pathname.startsWith("/assets/") || /\.(css|js|png|jpg|svg|woff2?)$/.test(url.pathname))) {
          const cache = await caches.open(ASSET_CACHE);
          cache.put(req, res.clone());
        }
        return res;
      } catch {
        return cached || Response.error();
      }
    })()
  );
});
