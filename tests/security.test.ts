import assert from "assert";
import fs from "fs";
import path from "path";
import {
  safeEqual,
  maskPhone,
  maskEmail,
  fingerprint,
  isAllowedProxyTarget,
  assertSafeOutboundUrl,
  assertAllowedUpload,
  buildStoredFilename,
} from "../src/server/security.ts";

describe("security helpers", () => {
  describe("safeEqual", () => {
    it("matches identical strings", () => {
      assert.strictEqual(safeEqual("abc123", "abc123"), true);
    });
    it("rejects different strings", () => {
      assert.strictEqual(safeEqual("abc123", "abc124"), false);
    });
    it("rejects empty vs non-empty", () => {
      assert.strictEqual(safeEqual("", "x"), false);
    });
  });

  describe("maskPhone", () => {
    it("hides all but the last four digits", () => {
      const masked = maskPhone("0945123456");
      assert.ok(!masked.includes("0945"), "must not leak the leading digits");
      assert.ok(masked.endsWith("3456"), "keeps the last four digits");
    });
    it("masks short values entirely", () => {
      assert.strictEqual(maskPhone("12"), "***");
    });
  });

  describe("maskEmail", () => {
    it("keeps the domain and first initial only", () => {
      const masked = maskEmail("someone@example.com");
      assert.ok(masked.endsWith("@example.com"));
      assert.ok(!masked.includes("someone"));
    });
  });

  describe("fingerprint", () => {
    it("returns a stable short hash", () => {
      const a = fingerprint("secret");
      assert.strictEqual(a, fingerprint("secret"));
      assert.strictEqual(a.length, 8);
      assert.notStrictEqual(a, fingerprint("different"));
    });
  });

  describe("isAllowedProxyTarget", () => {
    it("allows the Firestore host", () => {
      const verdict = isAllowedProxyTarget("firestore.googleapis.com/v1/projects/x");
      assert.strictEqual(verdict.ok, true);
    });
    it("allows identitytoolkit", () => {
      assert.strictEqual(isAllowedProxyTarget("identitytoolkit.googleapis.com/v1/accounts:signUp").ok, true);
    });
    it("blocks an arbitrary third-party host", () => {
      const verdict = isAllowedProxyTarget("evil.example.com/steal");
      assert.strictEqual(verdict.ok, false);
    });
    it("blocks a host that merely ends with an allowed suffix", () => {
      const verdict = isAllowedProxyTarget("firestore.googleapis.com.evil.io/v1");
      assert.strictEqual(verdict.ok, false);
    });
    it("blocks a bare IP target", () => {
      const verdict = isAllowedProxyTarget("169.254.169.254/latest/meta-data/");
      assert.strictEqual(verdict.ok, false);
    });
  });

  describe("assertSafeOutboundUrl", () => {
    it("accepts a normal public https URL", () => {
      const url = assertSafeOutboundUrl("https://hooks.example.com/inbound");
      assert.strictEqual(url.hostname, "hooks.example.com");
    });
    it("rejects non-http schemes", () => {
      assert.throws(() => assertSafeOutboundUrl("file:///etc/passwd"));
      assert.throws(() => assertSafeOutboundUrl("ftp://example.com"));
    });
    it("rejects loopback and metadata targets", () => {
      assert.throws(() => assertSafeOutboundUrl("http://127.0.0.1/"));
      assert.throws(() => assertSafeOutboundUrl("http://localhost/"));
      assert.throws(() => assertSafeOutboundUrl("http://169.254.169.254/"));
    });
    it("rejects private ranges", () => {
      assert.throws(() => assertSafeOutboundUrl("http://10.0.0.5/"));
      assert.throws(() => assertSafeOutboundUrl("http://192.168.1.1/"));
      assert.throws(() => assertSafeOutboundUrl("http://172.16.0.1/"));
    });
    it("rejects credentials embedded in the URL", () => {
      assert.throws(() => assertSafeOutboundUrl("https://user:pass@example.com/"));
    });
  });

  describe("assertAllowedUpload", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const pdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0, 0, 0, 0, 0, 0]);

    it("accepts a real PNG", () => {
      assert.strictEqual(assertAllowedUpload(png, "photo.png", "image/png"), "image/png");
    });
    it("accepts a real JPEG", () => {
      assert.strictEqual(assertAllowedUpload(jpg, "photo.jpg", "image/jpeg"), "image/jpeg");
    });
    it("accepts a real PDF", () => {
      assert.strictEqual(assertAllowedUpload(pdf, "doc.pdf", "application/pdf"), "application/pdf");
    });

    it("rejects a script renamed to .png", () => {
      const html = Buffer.from("<script>alert(1)</script>..........", "utf8");
      assert.throws(() => assertAllowedUpload(html, "evil.png", "image/png"));
    });
    it("rejects a Mach-O binary renamed to .jpg", () => {
      const macho = Buffer.from([0xcf, 0xfa, 0xed, 0xfe, 0x07, 0x00, 0x00, 0x01, 0, 0, 0, 0]);
      assert.throws(() => assertAllowedUpload(macho, "trojan.jpg", "image/jpeg"));
    });
    it("rejects dangerous extensions outright", () => {
      for (const name of ["evil.html", "x.svg", "run.exe", "s.sh", "p.php"]) {
        assert.throws(() => assertAllowedUpload(png, name), undefined, `${name} must be rejected`);
      }
    });
    it("rejects an extension that disagrees with the content", () => {
      // A PNG payload submitted as a .pdf must not be stored.
      assert.throws(() => assertAllowedUpload(png, "payload.pdf", "application/pdf"));
    });
    it("rejects a declared MIME that disagrees with the content", () => {
      assert.throws(() => assertAllowedUpload(png, "photo.png", "image/gif"));
    });
  });

  describe("buildStoredFilename", () => {
    it("derives the extension from the detected type, not the input", () => {
      assert.ok(buildStoredFilename("image/png").endsWith(".png"));
      assert.ok(buildStoredFilename("application/pdf").endsWith(".pdf"));
    });
    it("is unpredictable", () => {
      const a = buildStoredFilename("image/png");
      const b = buildStoredFilename("image/png");
      assert.notStrictEqual(a, b);
    });
  });
});

describe("firestore.rules static analysis", () => {
  const rulesPath = path.join(process.cwd(), "firestore.rules");
  const rules = fs.readFileSync(rulesPath, "utf8");

  it("denies by default with a catch-all", () => {
    assert.ok(
      /match\s+\/\{document=\*\*\}\s*\{\s*allow read, write: if false;/.test(rules),
      "must keep a default-deny catch-all"
    );
  });

  it("contains no hardcoded administrator email addresses", () => {
    // A published rules file with a literal admin email grants admin to
    // whoever registers that address.
    const emailLiterals = rules.match(/['"][^'"]+@[^'"]+\.[a-z]{2,}['"]/gi) || [];
    const suspicious = emailLiterals.filter((e) => !/example|test|domain/.test(e));
    assert.deepStrictEqual(
      suspicious,
      [],
      `found hardcoded email literals in rules: ${suspicious.join(", ")}`
    );
  });

  it("does not leave the appointments collection publicly readable", () => {
    const block = /match \/appointments\/\{appointmentId\} \{([\s\S]*?)\n    \}/.exec(rules);
    assert.ok(block, "appointments block must exist");
    assert.ok(
      !/allow\s+read\s*:\s*if true/.test(block![1]),
      "appointments must not be world-readable"
    );
  });

  it("does not allow clients to self-assign the admin role", () => {
    // The users update rule must pin role to its stored value for owners.
    const usersBlock = /match \/users\/\{userId\} \{([\s\S]*?)\n    \}\n/.exec(rules);
    assert.ok(usersBlock, "users block must exist");
    assert.ok(
      /incoming\(\)\.role == resource\.data\.role/.test(usersBlock![1]),
      "an owner update must not be able to change its own role"
    );
    assert.ok(
      /incoming\(\)\.role == 'client'/.test(usersBlock![1]),
      "profile creation must force the client role"
    );
  });
});

describe("repository secret hygiene", () => {
  const serverSource = fs.readFileSync(path.join(process.cwd(), "server.ts"), "utf8");

  it("does not embed a Firebase password in the server source", () => {
    // The reminder worker used to sign in with a literal password, which
    // shipped to anyone who read the source or the built bundle.
    assert.ok(
      !/serverPass\s*=\s*["'][^"']+["']/.test(serverSource),
      "the service account password must come from the environment"
    );
  });

  it("reads service account credentials from the environment", () => {
    assert.ok(
      /process\.env\.FIREBASE_SERVICE_PASSWORD/.test(serverSource),
      "must read FIREBASE_SERVICE_PASSWORD from the environment"
    );
  });

  it("guards the cron endpoints that dispatch real messages", () => {
    assert.ok(
      /app\.all\("\/api\/cron\/[^"]+",\s*requireCronAuth/.test(serverSource),
      "cron endpoints must require authentication"
    );
  });

  it("guards the operator endpoints", () => {
    const protectedRoutes = [
      "/api/upload-app",
      "/api/whatsapp/send",
      "/api/whatsapp/ping",
      "/api/whatsapp/test-sub-webhook",
    ];
    for (const route of protectedRoutes) {
      // `requireOperatorAuth` accepts either the scheduler token or a Firebase
      // ID token carrying the admin claim; `requireAdminAuth` accepts only the
      // static admin token. Both are acceptable guards, but an unguarded route
      // is not, so assert that one of them is present.
      const pattern = new RegExp(
        `app\\.post\\("${route.replace(/\//g, "\\/")}"[^)]*(requireOperatorAuth|requireAdminAuth)`
      );
      assert.ok(pattern.test(serverSource), `${route} must require operator auth`);
    }
  });

  it("matches the admin allowlist against the verified token, not the request", () => {
    const securitySource = fs.readFileSync(
      path.join(process.cwd(), "src", "server", "security.ts"),
      "utf8"
    );

    // The allowlist must be read server-side from the environment.
    assert.match(
      securitySource,
      /process\.env\.ADMIN_EMAILS/,
      "the admin allowlist must come from ADMIN_EMAILS"
    );

    // It must be applied to the decoded token, and only after verification.
    // Reading `req.body.email`, `req.query.email` or a client-supplied header
    // would let anyone claim the address.
    assert.match(
      securitySource,
      /decoded\.email/,
      "the allowlist must be compared against the email in the verified token"
    );

    for (const spoof of ["req.body.email", "req.query.email", "req.headers.email"]) {
      assert.ok(
        !securitySource.includes(spoof),
        `the admin check must not trust ${spoof}`
      );
    }

    // Verification must precede the allowlist comparison.
    const verifyAt = securitySource.indexOf("await verify(presented)");
    const matchAt = securitySource.indexOf("adminEmails().has");
    assert.ok(verifyAt !== -1 && matchAt !== -1, "both the verifier and the check must exist");
    assert.ok(
      verifyAt < matchAt,
      "the token signature must be verified before the email is trusted"
    );
  });

  it("treats the browser admin email list as a display hint only", () => {
    const clientApi = fs.readFileSync(path.join(process.cwd(), "src", "lib", "api.ts"), "utf8");

    // It may be present in the client, but it must not be the thing that
    // authorises anything, and it must not write an admin role to Firestore.
    assert.match(
      clientApi,
      /ADMIN_UI_EMAILS/,
      "the display hint is expected in the client"
    );
    assert.ok(
      !/setDoc|updateDoc/.test(clientApi),
      "the client display hint must not write to Firestore"
    );
  });

  it("does not force a browser to hold a server-only secret", () => {
    // The admin panel authenticates with a Firebase ID token. A static token
    // compiled into the bundle would publish a privileged credential to every
    // visitor, so the browser must go through the ID-token helper instead.
    const clientApi = fs.readFileSync(path.join(process.cwd(), "src", "lib", "api.ts"), "utf8");
    assert.match(
      clientApi,
      /getIdToken/,
      "the client auth helper must attach a Firebase ID token"
    );

    // Every operator call in the browser must go through authFetch so the token
    // is attached, and no browser source may name a server-only token.
    const clientFiles = [
      "src/App.tsx",
      "src/components/SubTasksManagerModal.tsx",
      "src/lib/api.ts",
    ];
    for (const file of clientFiles) {
      const contents = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      assert.doesNotMatch(
        contents,
        /ADMIN_API_TOKEN|INTERNAL_API_TOKEN/,
        `${file} must not reference a server-only token`
      );
    }

    for (const route of ["/api/whatsapp/send", "/api/whatsapp/ping", "/api/whatsapp/test-sub-webhook"]) {
      const callers = clientFiles.filter((file) =>
        new RegExp(`fetch\\(\\s*['"\`]${route.replace(/\//g, "\\/")}['"\`]`).test(
          fs.readFileSync(path.join(process.cwd(), file), "utf8")
        )
      );
      for (const file of callers) {
        assert.doesNotMatch(
          fs.readFileSync(path.join(process.cwd(), file), "utf8"),
          new RegExp(`(?<!auth)fetch\\(\\s*['"\`]${route.replace(/\//g, "\\/")}['"\`]`),
          `${file} must call ${route} via authFetch so the ID token is attached`
        );
      }
    }
  });

  it("never decides an admin role from an email address in the browser", () => {
    // Regression guard. The client used to compare the signed-in address
    // against a hardcoded admin email and write the result into the user's own
    // profile document. Because the write is chosen by the client, that was a
    // privilege escalation, not a convenience. Admin standing must come from
    // the signed `admin` custom claim instead.
    const clientFiles = [
      "src/App.tsx",
      "src/components/AuthScreen.tsx",
      "src/lib/api.ts",
    ];
    for (const file of clientFiles) {
      const contents = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      assert.doesNotMatch(
        contents,
        /role\s*:\s*[^,\n]*email/i,
        `${file} must not derive a role from an email address`
      );
      assert.doesNotMatch(
        contents,
        /@gmail\.com|@outlook\.com|@hotmail\.com/,
        `${file} must not hardcode a personal admin address`
      );
    }

    // Provisioning a profile must always start at 'client'. An admin may
    // promote *other* people from the admin panel (Firestore rules gate that
    // write), but the app must never stamp the signed-in user as admin.
    const authScreen = fs.readFileSync(path.join(process.cwd(), "src", "components", "AuthScreen.tsx"), "utf8");
    const appSource = fs.readFileSync(path.join(process.cwd(), "src", "App.tsx"), "utf8");
    assert.doesNotMatch(
      authScreen,
      /role:\s*'admin'/,
      "AuthScreen must never write an admin role"
    );
    // The auto-provision on auth change (App.tsx) must be a plain client.
    assert.match(
      appSource,
      /role:\s*'client',\s*\n\s*createdAt:/,
      "the auth-change auto-provision must create a 'client' profile"
    );

    // The claim reader must exist and be the source of truth for the UI.
    assert.match(
      fs.readFileSync(path.join(process.cwd(), "src", "lib", "api.ts"), "utf8"),
      /claims\.admin/,
      "the role must be resolved from the signed admin claim"
    );
  });
});
