import assert from "assert";
import fs from "fs";
import path from "path";

// Guards the service worker cache policy. The app routes Firebase Auth and
// Firestore through an /api-proxy/ path (see src/main.tsx), so anything cached
// there would replay a session or serve stale bookings on an installed app.
//
// The exclusion list and the predicate are read out of the shipped public/sw.js
// instead of being duplicated, so this test cannot drift from what the browser
// actually runs after a deploy.

const SW_PATH = path.resolve(__dirname, "..", "public", "sw.js");

type Url = { origin: string; pathname: string; href: string };

function loadPolicy(): { neverCache: string[]; isCacheable: (url: Url) => boolean } {
  const src = fs.readFileSync(SW_PATH, "utf8");
  const listMatch = src.match(/const NEVER_CACHE = (\[[\s\S]*?\]);/);
  const fnMatch = src.match(/function isCacheable\(url\) \{[\s\S]*?\n\}/);
  assert.ok(listMatch, "NEVER_CACHE list not found in public/sw.js");
  assert.ok(fnMatch, "isCacheable() not found in public/sw.js");

  const neverCache = new Function(`return ${listMatch[1]}`)() as string[];
  const isCacheable = new Function(
    "self",
    "NEVER_CACHE",
    fnMatch[0].replace("function isCacheable", "return function")
  )({ location: { origin: "https://site.example" } }, neverCache) as (url: Url) => boolean;

  return { neverCache, isCacheable };
}

const ORIGIN = "https://site.example";
const at = (p: string): Url => {
  const u = new URL(p, ORIGIN);
  return { origin: u.origin, pathname: u.pathname, href: u.href };
};

describe("service worker cache policy", () => {
  const { neverCache, isCacheable } = loadPolicy();

  describe("must never be cached", () => {
    const cases: [string, string][] = [
      ["/api/health", "own API"],
      ["/api/appointments", "appointment API"],
      ["/api/users/me", "user data API"],
      ["/api-proxy/firestore.googleapis.com/v1/projects/p/databases/d/documents/properties", "Firestore via proxy"],
      ["/api-proxy/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword", "Auth sign-in via proxy"],
      ["/api-proxy/securetoken.googleapis.com/v1/token", "token refresh via proxy"],
      ["/api-proxy/identitytoolkit.googleapis.com/v1/accounts:signOut", "sign-out via proxy"],
      ["/api-proxy/securetoken.googleapis.com/v1/revoke", "token revoke via proxy"],
      ["/api-proxy/firebaseinstallations.googleapis.com/v1/projects/p/installations", "installations via proxy"],
    ];

    for (const [route, label] of cases) {
      it(`skips ${label}`, () => {
        assert.strictEqual(isCacheable(at(route)), false, `${route} must never enter the cache`);
      });
    }

    it("covers /api-proxy/ explicitly, since it does not start with /api/", () => {
      assert.ok(
        neverCache.includes("/api-proxy/"),
        "/api-proxy/ must be listed on its own or Auth and Firestore responses become cacheable"
      );
    });

    it("leaves third-party origins alone", () => {
      const u = new URL("https://cdn.other/x.js");
      assert.strictEqual(isCacheable({ origin: u.origin, pathname: u.pathname, href: u.href }), false);
    });
  });

  describe("may be cached", () => {
    const cases: [string, string][] = [
      ["/", "app shell"],
      ["/assets/index-abc123.js", "hashed bundle"],
      ["/assets/index-def456.css", "hashed stylesheet"],
      ["/icon-192.png", "app icon"],
      ["/apple-touch-icon.png", "iOS icon"],
    ];

    for (const [route, label] of cases) {
      it(`caches ${label}`, () => {
        assert.strictEqual(isCacheable(at(route)), true, `${route} must be cacheable to work offline`);
      });
    }
  });
});
