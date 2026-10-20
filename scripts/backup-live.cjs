// Creates a restorable backup of everything that matters before any change is
// made to the live project:
//   - every Firestore collection, with document IDs
//   - Auth users + custom claims (credentials are never stored)
//   - the live ruleset, the previous ruleset, and the local rules file
//   - a manifest with checksums so tampering is detectable
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { JWT } = require("google-auth-library");

const PROJECT = "gen-lang-client-0452433990";
const NUMBER = "238794968083";
const DB = "ai-studio-103a56d2-a888-4d96-8ce9-303c51e1cfcc";
const RULES_API = "https://firebaserules.googleapis.com/v1";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node backup-live.cjs <output-dir>");
  process.exit(1);
}

async function main() {
  const root = path.join(__dirname, "..");
  fs.mkdirSync(OUT, { recursive: true });

  const sa = JSON.parse(fs.readFileSync(path.join(root, "secrets", "sa.json"), "utf8"));
  const { token } = await new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  }).getAccessToken();
  const H = { Authorization: `Bearer ${token}` };

  // ---- Firestore -----------------------------------------------------------
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(root, "secrets", "sa.json");
  const { initializeApp, applicationDefault } = require("firebase-admin/app");
  const { getFirestore } = require("firebase-admin/firestore");
  const app = initializeApp({ credential: applicationDefault() }, `backup-${Date.now()}`);
  const db = getFirestore(app, DB);

  const collections = await db.listCollections();
  const firestore = {};
  for (const c of collections) {
    const snap = await c.get();
    firestore[c.id] = snap.docs.map((d) => ({ __id: d.id, ...d.data() }));
    console.log(`  ${c.id.padEnd(28)} ${snap.size} docs`);
  }
  fs.writeFileSync(path.join(OUT, "firestore.json"), JSON.stringify(firestore, null, 2));

  // ---- Auth (no credentials, ever) ----------------------------------------
  const { getAuth } = require("firebase-admin/auth");
  const auth = getAuth(app);
  const users = [];
  let page = auth.listUsers(1000);
  while (true) {
    const r = await page;
    for (const u of r.users) {
      users.push({
        uid: u.uid,
        email: u.email || null,
        emailVerified: !!u.emailVerified,
        disabled: !!u.disabled,
        customClaims: u.customClaims || {},
        createdAt: u.metadata?.creationTime || null,
        lastLoginAt: u.metadata?.lastSignInTime || null,
        providers: u.providerData?.map((p) => p.providerId) || [],
      });
    }
    if (r.pageToken) page = auth.listUsers(1000, r.pageToken);
    else break;
  }
  fs.writeFileSync(path.join(OUT, "auth-users.json"), JSON.stringify(users, null, 2));
  console.log(`  auth users                   ${users.length}`);

  // ---- Rules ---------------------------------------------------------------
  const getJson = async (url) => (await fetch(url, { headers: H })).json();
  const rel = await getJson(`${RULES_API}/projects/${PROJECT}/releases?pageSize=100`);
  const rulesInfo = {};
  for (const r of rel.releases || []) {
    const short = r.name.split("/releases/")[1];
    const id = r.rulesetName.split("/").pop();
    rulesInfo[short] = { rulesetName: r.rulesetName, rulesetId: id };
    if (!fs.existsSync(path.join(OUT, `ruleset-${short.replace(/\//g, "_")}.rules`))) {
      const rs = await getJson(`${RULES_API}/projects/${PROJECT}/rulesets/${id}`);
      const content = (rs.source?.files || []).map((f) => f.content).join("\n");
      fs.writeFileSync(path.join(OUT, `ruleset-${short.replace(/\//g, "_")}.rules`), content);
      console.log(`  ruleset saved                 ${short} (${content.split("\n").length} lines)`);
    }
  }
  fs.writeFileSync(path.join(OUT, "releases.json"), JSON.stringify(rulesInfo, null, 2));
  fs.copyFileSync(path.join(root, "firestore.rules"), path.join(OUT, "local-firestore.rules"));

  // ---- manifest ------------------------------------------------------------
  const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex").slice(0, 16);
  const files = fs.readdirSync(OUT).filter((f) => f !== "manifest.json");
  const manifest = {
    createdAt: new Date().toISOString(),
    project: PROJECT,
    projectNumber: NUMBER,
    databaseId: DB,
    releases: rulesInfo,
    counts: Object.fromEntries(Object.entries(firestore).map(([k, v]) => [k, v.length])),
    authUsers: users.length,
    checksums: Object.fromEntries(files.map((f) => [f, sha(path.join(OUT, f))])),
  };
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log("\nbackup written to:", OUT);
  console.log("files:", files.concat("manifest.json").join(", "));
  process.exit(0);
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
