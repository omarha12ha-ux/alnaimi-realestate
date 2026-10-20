// Guards the service worker cache policy: nothing that carries credentials,
// Firestore documents or API responses may ever reach the cache.
//
// The predicate and the exclusion list are read out of the shipped sw.js rather
// than duplicated here, so this test cannot drift from what the browser runs.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "public", "sw.js"), "utf8");

const listMatch = src.match(/const NEVER_CACHE = (\[[\s\S]*?\]);/);
const fnMatch = src.match(/function isCacheable\(url\) \{[\s\S]*?\n\}/);
assert.ok(listMatch, "NEVER_CACHE list not found in sw.js");
assert.ok(fnMatch, "isCacheable() not found in sw.js");

const NEVER_CACHE = new Function(`return ${listMatch[1]}`)();
const isCacheable = new Function(
  "self",
  "NEVER_CACHE",
  fnMatch[0].replace("function isCacheable", "return function")
)({ location: { origin: "https://site.example" } }, NEVER_CACHE);

const ORIGIN = "https://site.example";

const shouldSkip = [
  ["/api/health", "own API"],
  ["/api-proxy/firestore.googleapis.com/v1/projects/p/databases/d/documents/properties", "Firestore via proxy"],
  ["/api-proxy/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword", "Auth sign-in via proxy"],
  ["/api-proxy/securetoken.googleapis.com/v1/token", "token refresh via proxy"],
  ["/api-proxy/identitytoolkit.googleapis.com/v1/accounts:signOut", "sign-out via proxy"],
  ["/api-proxy/securetoken.googleapis.com/v1/revoke", "token revoke via proxy"],
  ["/api-proxy/firebaseinstallations.googleapis.com/v1/projects/p/installations", "installations via proxy"],
  ["/api/appointments", "appointment API"],
  ["/api/users/me", "user data API"],
];

const shouldCache = [
  ["/", "app shell"],
  ["/assets/index-abc123.js", "hashed bundle"],
  ["/assets/index-def456.css", "hashed stylesheet"],
  ["/icon-192.png", "app icon"],
  ["/apple-touch-icon.png", "iOS icon"],
  ["/manifest.json", "manifest (served no-store by the server anyway)"],
];

let failures = 0;
for (const [path, label] of shouldSkip) {
  const url = new URL(path, ORIGIN);
  const cacheable = isCacheable(url);
  if (cacheable) failures++;
  console.log(`  ${cacheable ? "FAIL" : "PASS"}  skip  ${path.slice(0, 62).padEnd(62)} | ${label}`);
}
for (const [path, label] of shouldCache) {
  const url = new URL(path, ORIGIN);
  const cacheable = isCacheable(url);
  if (!cacheable) failures++;
  console.log(`  ${cacheable ? "PASS" : "FAIL"}  cache ${path.slice(0, 62).padEnd(62)} | ${label}`);
}

// Anything on a different origin must be left alone entirely.
const crossOrigin = isCacheable(new URL("https://cdn.other/x.js"));
if (crossOrigin) failures++;
console.log(`  ${crossOrigin ? "FAIL" : "PASS"}  skip  https://cdn.other/x.js${" ".repeat(41)}| third-party origin`);

assert.equal(
  failures,
  0,
  `${failures} case(s) wrong: the cache policy would store something sensitive or drop a needed asset`
);
console.log("\n  PASS: no credential, API or Firestore response can enter the service worker cache.");
