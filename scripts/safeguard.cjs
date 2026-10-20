// Safeguard: check the live site's health and repair the rules if they were
// reverted. Designed to be run by a non-technical owner via a .bat file.
//
//   node scripts/safeguard.cjs            # check only, changes nothing
//   node scripts/safeguard.cjs --repair   # restore the known-good ruleset
//
// The known-good ruleset is pinned by ID, so repair works even if the local
// files or this script's directory are damaged.
const fs = require("fs");
const path = require("path");
const { JWT } = require("google-auth-library");

const PROJECT = "gen-lang-client-0452433990";
const NUMBER = "238794968083";
const DB = "ai-studio-103a56d2-a888-4d96-8ce9-303c51e1cfcc";
const API = "https://firebaserules.googleapis.com/v1";
const RELEASE = `cloud.firestore/${DB}`;

// Pinned: the ruleset verified to contain no hardcoded admin emails.
const GOOD = "90f05672-2b78-49d0-83c3-653f971c44e4";
const SITE = "https://ais-pre-onjhwxm7xhcbhv3zu5qoa5-254257418489.europe-west2.run.app/";

const BAD_MARKERS = ["tlasalbaraa@gmail.com", "aaadddnnnaaannn0@gmail.com", "admin-server-reminder@alouj.com"];

const line = (s = "") => console.log(s);
const ok = (s) => console.log(`  [GOOD] ${s}`);
const bad = (s) => console.log(`  [!!  ] ${s}`);
const warn = (s) => console.log(`  [note] ${s}`);

async function main() {
  const repair = process.argv.includes("--repair");
  const root = path.join(__dirname, "..");
  const saPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(root, "secrets", "sa.json");
  if (!fs.existsSync(saPath)) {
    console.error(`service account key not found: ${saPath}`);
    process.exit(2);
  }
  const sa = JSON.parse(fs.readFileSync(saPath, "utf8"));
  const { token } = await new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  }).getAccessToken();
  const H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const getJson = async (u) => (await fetch(u, { headers: H })).json();

  let problems = 0;

  // ---- 1. is the website answering? --------------------------------------
  line("\n1) SITE");
  try {
    const r = await fetch(SITE);
    const body = await r.text();
    if (r.status === 200) ok(`responds normally (HTTP 200, ${body.length} bytes)`);
    else {
      bad(`HTTP ${r.status}`);
      problems++;
    }
    if (/cookie_check|blocking a required security cookie/i.test(body)) {
      warn("Google's preview cookie gate is showing to visitors (known, not a fault in your code)");
    }
  } catch (e) {
    bad(`unreachable: ${e.message}`);
    problems++;
  }

  // ---- 2. are the security rules intact? ---------------------------------
  line("\n2) SECURITY RULES");
  const rel = await getJson(`${API}/projects/${PROJECT}/releases?pageSize=100`);
  const cur = (rel.releases || []).find((r) => r.name.endsWith(`/releases/${RELEASE}`));
  const liveId = cur ? cur.rulesetName.split("/").pop() : null;
  const rs = liveId ? await getJson(`${API}/projects/${PROJECT}/rulesets/${liveId}`) : null;
  const content = rs?.source?.files?.map((f) => f.content).join("") || "";
  const leaked = BAD_MARKERS.filter((m) => content.includes(m));

  if (!liveId) {
    bad("no ruleset is attached to the database");
    problems++;
  } else {
    ok(`live ruleset ${liveId.slice(0, 8)} (${content.split("\n").length} lines)`);
    if (leaked.length) {
      bad(`VULNERABLE - contains old admin emails: ${leaked.join(", ")}`);
      problems++;
    } else ok("no hardcoded admin emails");
    if (liveId === GOOD) ok("this is the verified secure version");
    else warn("not the pinned secure version (may still be fine)");
  }

  // ---- 3. repair ---------------------------------------------------------
  if (repair) {
    line("\n3) REPAIR");
    if (liveId === GOOD) {
      ok("nothing to do - already on the secure version");
    } else {
      const r = await fetch(`${API}/projects/${PROJECT}/releases/${RELEASE}`, {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({
          release: { name: `projects/${PROJECT}/releases/${RELEASE}`, rulesetName: `projects/${PROJECT}/rulesets/${GOOD}` },
        }),
      });
      if (r.status === 200) ok("secure ruleset re-applied");
      else {
        bad(`repair failed (HTTP ${r.status})`);
        problems++;
      }
    }
  } else if (problems > 0) {
    line("\n3) REPAIR");
    warn(`found ${problems} problem(s) - run:  repair-rules.bat`);
  }

  // ---- 4. data sanity ----------------------------------------------------
  line("\n4) YOUR DATA");
  try {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = saPath;
    const { initializeApp, applicationDefault } = require("firebase-admin/app");
    const { getFirestore } = require("firebase-admin/firestore");
    const app = initializeApp({ credential: applicationDefault() }, `sg-${Date.now()}`);
    const db = getFirestore(app, DB);
    for (const c of ["properties", "appointments", "users"]) {
      const n = (await db.collection(c).count().get()).data().count;
      if (n > 0) ok(`${c}: ${n} records`);
      else {
        warn(`${c}: empty`);
        problems++;
      }
    }
  } catch (e) {
    warn(`could not read data: ${e.message}`);
  }

  line("");
  line(problems === 0 ? "RESULT: everything is fine." : `RESULT: ${problems} item(s) need attention.`);
  process.exit(problems === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("error:", e.message);
  process.exit(2);
});
