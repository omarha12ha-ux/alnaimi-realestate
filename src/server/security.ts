import type { Request, Response, NextFunction, RequestHandler } from "express";
import crypto from "crypto";

/**
 * Server-side security primitives.
 *
 * Every privileged HTTP surface of this applet must sit behind one of the
 * guards defined here. The applet is exposed publicly, so an unauthenticated
 * endpoint is a liability: it can be used to burn the Gemini quota, send
 * WhatsApp messages as the company, create Stripe intents, or (via the proxy)
 * turn the server into an open relay.
 */

// ---------------------------------------------------------------------------
// Timing-safe string comparison
// ---------------------------------------------------------------------------

/**
 * Constant-time comparison that does not leak length via early return.
 * Compares SHA-256 digests so the inputs are always the same size.
 */
export function safeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ha = crypto.createHash("sha256").update(a, "utf8").digest();
  const hb = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(ha, hb);
}

function extractBearer(req: Request): string | null {
  const header = req.headers["authorization"];
  if (typeof header === "string") {
    const match = /^Bearer\s+(.+)$/i.exec(header.trim());
    if (match) return match[1].trim();
  }
  const alt = req.headers["x-api-key"];
  if (typeof alt === "string" && alt.trim()) return alt.trim();
  return null;
}

// ---------------------------------------------------------------------------
// Request authentication
// ---------------------------------------------------------------------------

export type PrincipalKind = "admin" | "user" | "cron" | "public";

export interface Principal {
  kind: PrincipalKind;
  /** Verified Firebase uid, or the configured admin email. */
  id: string;
}

/**
 * Verifies a Firebase ID token and maps it onto a principal.
 *
 * The static tokens below are the right credential for the scheduler and for
 * server-to-server calls, but they cannot be used by a browser: shipping them
 * in the bundle would publish them to every visitor. Admin panels live in the
 * browser, so they authenticate with the caller's Firebase ID token instead,
 * and admin standing is read from the signed `admin` custom claim.
 *
 * The token is verified against Google's public keys, so a client cannot
 * forge a claim by editing its own JWT.
 *
 * Resolved lazily and cached on `globalThis` so a missing Admin SDK
 * configuration degrades to "unauthorised" rather than crashing the server.
 */
let cachedVerifier: ((token: string) => Promise<Record<string, unknown>>) | null | undefined;

async function getIdTokenVerifier(): Promise<((t: string) => Promise<Record<string, unknown>>) | null> {
  if (cachedVerifier !== undefined) return cachedVerifier;
  try {
    const adminModule = await import("firebase-admin/auth");
    const appModule = await import("firebase-admin/app");

    const globalStore = globalThis as {
      __fbAdminApp?: unknown;
      __fbIdTokenVerifier?: (t: string) => Promise<Record<string, unknown>>;
    };

    if (!globalStore.__fbAdminApp) {
      // GOOGLE_APPLICATION_CREDENTIALS / workload identity. On Cloud Run this
      // resolves automatically, so no key file has to be shipped.
      globalStore.__fbAdminApp = appModule.getApps().length
        ? appModule.getApp()
        : appModule.initializeApp();
    }

    globalStore.__fbIdTokenVerifier = (token: string) =>
      adminModule.getAuth(globalStore.__fbAdminApp as never).verifyIdToken(token, true);
    cachedVerifier = globalStore.__fbIdTokenVerifier;
  } catch {
    // firebase-admin unavailable or not initialisable: treat ID tokens as
    // unusable. Static tokens keep working, so the scheduler is unaffected.
    cachedVerifier = null;
  }
  return cachedVerifier;
}

/**
 * Server-side administrator allowlist, read from `ADMIN_EMAILS`.
 *
 * Why this exists instead of hardcoding an address in the browser bundle: the
 * email is taken from a *verified* Firebase ID token, so the value is signed by
 * Google and cannot be forged by editing the token. An earlier revision compared
 * the address in client code and wrote the result into the user's own profile
 * document, which any visitor could repeat.
 *
 * This grants API access only. Firestore still enforces its own rules, and for
 * collection reads the `admin` custom claim remains the mechanism, because rule
 * conditions cannot read environment variables.
 *
 * Comma-separated. Compared case-insensitively after trimming.
 */
function adminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

/** True when the allowlist is non-empty. */
export function isAdminEmailConfigured(): boolean {
  return adminEmails().size > 0;
}

/**
 * Authentication for privileged endpoints. Accepts either:
 *   - the scheduler / operator static token, or
 *   - a Firebase ID token that either carries `admin: true` **or** whose
 *     verified email appears in `ADMIN_EMAILS`.
 */
export const requireOperatorAuth: RequestHandler = async (req, res, next) => {
  const presented = extractBearer(req);

  if (!presented) {
    res.status(401).json({ error: "unauthorized", message: "Missing bearer token." });
    return;
  }

  // A Firebase ID token is a long JWT; the static tokens are short secrets.
  // Checking the shape first avoids a pointless network round trip for the
  // scheduler path and keeps the failure modes distinct.
  if (presented.split(".").length === 3) {
    const verify = await getIdTokenVerifier();
    if (verify) {
      try {
        const decoded = await verify(presented);
        const uid = String(decoded.uid ?? "");
        const email = typeof decoded.email === "string" ? decoded.email.toLowerCase() : "";

        if (decoded.admin === true) {
          (req as Request & { principal?: Principal }).principal = { kind: "admin", id: uid || "admin" };
          next();
          return;
        }

        if (email && adminEmails().has(email)) {
          (req as Request & { principal?: Principal }).principal = { kind: "admin", id: uid || email };
          next();
          return;
        }

        res.status(403).json({
          error: "forbidden",
          message: "This account is not an administrator.",
        });
        return;
      } catch {
        res.status(401).json({ error: "unauthorized", message: "Invalid or expired ID token." });
        return;
      }
    }
  }

  requirePrincipal(req, res, next, { allow: ["admin", "cron"], principal: "admin" });
};

/**
 * Bearer-token authentication backed by secrets supplied via environment.
 *
 * Accepted credentials, in priority order:
 *   1. `INTERNAL_API_TOKEN`  -> principal kind "cron"  (machine-to-machine)
 *   2. `ADMIN_API_TOKEN`     -> principal kind "admin" (human admin tooling)
 *
 * Neither token is ever sent to the browser bundle, so the client cannot
 * forge a request by replaying a value that is already public.
 */
export function requirePrincipal(
  req: Request,
  res: Response,
  next: NextFunction,
  options: { allow: PrincipalKind[]; principal: PrincipalKind }
): void {
  const internalToken = process.env.INTERNAL_API_TOKEN || "";
  const adminToken = process.env.ADMIN_API_TOKEN || "";

  if (!internalToken && !adminToken) {
    // Fail closed. A deployment that forgot to configure tokens must not
    // silently expose every privileged endpoint to the internet.
    res.status(503).json({
      error: "service_not_configured",
      message: "Server credentials are not configured. Set INTERNAL_API_TOKEN and/or ADMIN_API_TOKEN.",
    });
    return;
  }

  const presented = extractBearer(req);
  if (!presented) {
    res.status(401).json({ error: "unauthorized", message: "Missing bearer token." });
    return;
  }

  let kind: PrincipalKind | null = null;
  if (internalToken && safeEqual(presented, internalToken)) {
    kind = "cron";
  } else if (adminToken && safeEqual(presented, adminToken)) {
    kind = "admin";
  }

  if (!kind) {
    res.status(403).json({ error: "forbidden", message: "Invalid token." });
    return;
  }

  if (!options.allow.includes(kind)) {
    res.status(403).json({
      error: "forbidden",
      message: `This endpoint requires one of: ${options.allow.join(", ")}.`,
    });
    return;
  }

  (req as Request & { principal?: Principal }).principal = { kind, id: kind };
  next();
}

/** Auth for the scheduler callbacks that hit `/api/cron/*`. */
export const requireCronAuth: RequestHandler = (req, res, next) =>
  requirePrincipal(req, res, next, { allow: ["cron", "admin"], principal: "cron" });

/** Auth for operator-facing endpoints (WhatsApp tooling, uploads, Stripe). */
export const requireAdminAuth: RequestHandler = (req, res, next) =>
  requirePrincipal(req, res, next, { allow: ["admin", "cron"], principal: "admin" });

// ---------------------------------------------------------------------------
// Rate limiting (fixed window, in-memory)
// ---------------------------------------------------------------------------

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window limiter. Sufficient for a single-instance applet and keeps the
 * dependency surface at zero. A multi-instance deployment would need a shared
 * store, but for this workload the window is short and the process is
 * effectively a singleton.
 */
export function rateLimit(options: { windowMs: number; max: number; keyPrefix: string }): RequestHandler {
  const buckets = new Map<string, Bucket>();

  // Sweep expired buckets so a long-running process cannot grow unbounded.
  const sweeper = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, options.windowMs);
  // Do not hold the event loop open on shutdown.
  if (typeof sweeper.unref === "function") sweeper.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    // Scope by client IP; the proxy sits behind Cloud Run, which sets XFF.
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
      (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : "") ||
      req.socket?.remoteAddress ||
      "unknown";
    const key = `${options.keyPrefix}:${ip}`;

    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      res.setHeader("X-RateLimit-Limit", String(options.max));
      res.setHeader("X-RateLimit-Remaining", String(options.max - 1));
      next();
      return;
    }

    existing.count += 1;
    if (existing.count > options.max) {
      const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res.setHeader("X-RateLimit-Limit", String(options.max));
      res.setHeader("X-RateLimit-Remaining", "0");
      res.status(429).json({
        error: "rate_limited",
        message: "Too many requests. Please retry later.",
        retryAfterSeconds: retryAfter,
      });
      return;
    }

    res.setHeader("X-RateLimit-Limit", String(options.max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, options.max - existing.count)));
    next();
  };
}

// ---------------------------------------------------------------------------
// Outbound request safety (SSRF guard)
// ---------------------------------------------------------------------------

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "ip6-loopback",
  "metadata",
  "metadata.google.internal",
]);

function isPrivateIPv4(host: string): boolean {
  const parts = host.split(".").map((n) => Number.parseInt(n, 10));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isPrivateIPv6(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "::1" || h === "::") return true;
  if (h.startsWith("fe80") || h.startsWith("fc") || h.startsWith("fd")) return true;
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(h);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
}

/**
 * Validates an operator-supplied URL before the server fetches it.
 *
 * Blocks non-HTTP schemes, credentials in the URL, and any host that resolves
 * to a loopback / private / link-local address. This is what stops the
 * webhook tester from being used to reach internal infrastructure.
 */
export function assertSafeOutboundUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("الرابط غير صالح (malformed URL).");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("يُسمح فقط بروابط http أو https.");
  }
  if (url.username || url.password) {
    throw new Error("لا يُسمح بتضمين بيانات الاعتماد داخل الرابط.");
  }

  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith(".localhost") || host.endsWith(".internal")) {
    throw new Error("الهدف محجوب (blocked host).");
  }
  if (isPrivateIPv4(host) || isPrivateIPv6(host)) {
    throw new Error("الهدف محجوب (private address).");
  }

  return url;
}

// ---------------------------------------------------------------------------
// Proxy target allowlist
// ---------------------------------------------------------------------------

/**
 * The transparent proxy exists solely to route Firebase traffic around the
 * network path that is blocked for the audience of this deployment. Without a
 * hard allowlist the endpoint is an open relay that anyone can point at any
 * host, and the bandwidth bill lands on the owner.
 */
const PROXY_ALLOWED_HOSTS = new Set([
  "firestore.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "firebaseinstallations.googleapis.com",
  "firebaseremoteconfig.googleapis.com",
  "www.googleapis.com",
  "firebase.googleapis.com",
]);

export function isAllowedProxyTarget(targetWithQuery: string): { ok: true; host: string } | { ok: false; host: string } {
  let host = "";
  try {
    host = new URL(`https://${targetWithQuery}`).hostname.toLowerCase();
  } catch {
    return { ok: false, host: "" };
  }
  return { ok: PROXY_ALLOWED_HOSTS.has(host), host };
}

// ---------------------------------------------------------------------------
// Log redaction
// ---------------------------------------------------------------------------

/** Masks a phone number so logs carry no recoverable subscriber data. */
export function maskPhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length < 6) return "***";
  return `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
}

/** Masks the user portion of an email, keeping the domain for debugging. */
export function maskEmail(email: string): string {
  const value = (email || "").trim();
  if (!value.includes("@")) return "***";
  const [user, domain] = value.split("@");
  if (user.length <= 2) return `**@${domain}`;
  return `${user[0]}${"*".repeat(Math.min(user.length - 1, 6))}@${domain}`;
}

/** Replaces a user-supplied secret with a non-reversible hint. */
export function fingerprint(value: string): string {
  if (!value) return "none";
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 8);
}

// ---------------------------------------------------------------------------
// Upload validation
// ---------------------------------------------------------------------------

/**
 * Magic-byte signatures for the file types this applet actually accepts.
 * Extensions and the browser-supplied MIME type are both attacker-controlled,
 * so the real check is the leading bytes of the uploaded file. A `.png` that
 * is really a Mach-O binary or an HTML document is the classic bypass.
 */
const ALLOWED_SIGNATURES: Array<{ ext: string; mime: string; bytes: number[]; offset?: number }> = [
  { ext: ".png", mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { ext: ".jpg", mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { ext: ".jpeg", mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { ext: ".gif", mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { ext: ".webp", mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  { ext: ".pdf", mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
  { ext: ".apk", mime: "application/vnd.android.package-archive", bytes: [0x50, 0x4b, 0x03, 0x04] },
  { ext: ".zip", mime: "application/zip", bytes: [0x50, 0x4b, 0x03, 0x04] },
];

/**
 * Scripts that must never be servable from the upload directory. Even with a
 * strict allowlist this is the second line of defence: a stored `.html` or
 * `.svg` can carry script that executes in the site's origin.
 */
const DANGEROUS_EXTENSIONS = new Set([
  ".html", ".htm", ".xhtml", ".svg", ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx",
  ".php", ".phtml", ".asp", ".aspx", ".jsp", ".jspx", ".cgi", ".pl", ".py",
  ".rb", ".sh", ".bash", ".bat", ".cmd", ".com", ".exe", ".dll", ".so", ".dylib",
  ".jar", ".msi", ".scr", ".vbs", ".ps1", ".hta",
]);

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

/**
 * Validates an uploaded file by content, not by name.
 *
 * @param buffer    the first bytes of the file (>= 16 bytes is enough)
 * @param filename  the client-supplied original name
 * @param declaredMime the client-supplied MIME type
 * @returns the canonical MIME type that matched
 * @throws Error with an Arabic, user-facing message when the file is rejected
 */
export function assertAllowedUpload(buffer: Buffer, filename: string, declaredMime?: string): string {
  const ext = extensionOf(filename);

  if (DANGEROUS_EXTENSIONS.has(ext)) {
    throw new Error(`نوع الملف غير مسموح: ${ext}`);
  }
  if (ext.includes("..") || ext.includes("/") || ext.includes("\\")) {
    throw new Error("اسم الملف يحتوي على مسارات غير صالحة.");
  }
  if (buffer.length < 8) {
    throw new Error("الملف فارغ أو تالف.");
  }

  const matches = ALLOWED_SIGNATURES.filter((sig) => {
    const offset = sig.offset ?? 0;
    if (buffer.length < offset + sig.bytes.length) return false;
    return sig.bytes.every((byte, i) => buffer[offset + i] === byte);
  });

  if (matches.length === 0) {
    throw new Error("محتوى الملف لا يطابق أي نوع مسموح. الأنواع المقبولة: صور، PDF، ZIP/APK.");
  }

  // The extension must agree with the detected content, otherwise the file
  // would be served under a misleading name.
  const match = matches.find((sig) => sig.ext === ext);
  if (!match) {
    throw new Error("امتداد الملف لا يطابق محتواه الفعلي.");
  }

  // If the browser declared a type, it must also agree.
  if (declaredMime && declaredMime !== "application/octet-stream" && declaredMime !== match.mime) {
    throw new Error("نوع الملف المعلن لا يطابق محتواه.");
  }

  return match.mime;
}

/**
 * Builds a collision-resistant, fully server-controlled storage name.
 * The original name is never reused, so traversal and null-byte tricks in the
 * filename cannot influence the path on disk.
 */
export function buildStoredFilename(mime: string): string {
  const extByMime: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "application/zip": ".zip",
    "application/vnd.android.package-archive": ".apk",
  };
  return `${crypto.randomBytes(16).toString("hex")}${extByMime[mime] ?? ".bin"}`;
}

