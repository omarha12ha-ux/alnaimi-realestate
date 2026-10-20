// Verify the LIVE ruleset, not just the local file. Confirms the published
// rules no longer hardcode admin emails and that the duplicate function is gone.
const fs = require("fs");
const path = require("path");
const { JWT } = require("google-auth-library");

const PROJECT = "gen-lang-client-0452433990";
const DB = "ai-studio-103a56d2-a888-4d96-8ce9-303c51e1cfcc";
const API = "https://firebaserules.googleapis.com/v1";

const OLD_EMAILS = [
  "tlasalbaraa@gmail.com",
  "qasemabo23@gmail.com",
  "dha54032@gmail.com",
  "ramaalkhateeb24@gmail.com",
  "sdd08103@gmail.co",
  "aaadddnnnaaannn0@gmail.com",
  "admin-server-reminder@alouj.com",
];

async function main() {
  const root = path.join(__dirname, "..");
  const sa = JSON.parse(fs.readFileSync(path.join(root, "secrets", "sa.json"), "utf8"));
  const { token } = await new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  }).getAccessToken();

  const get = async (url) => {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const t = await r.text();
    try {
      return { status: r.status, json: JSON.parse(t) };
    } catch {
      return { status: r.status, json: null };
    }
  };

  const rel = await get(`${API}/projects/${PROJECT}/releases/cloud.firestore/${DB}`);
  if (rel.status !== 200) {
    console.log(`[${rel.status}] could not read the release`);
    process.exit(1);
  }
  const rulesetId = rel.json.rulesetName.split("/").pop();
  const rs = await get(`${API}/projects/${PROJECT}/rulesets/${rulesetId}`);
  if (rs.status !== 200) {
    console.log(`[${rs.status}] could not read the ruleset`);
    process.exit(1);
  }
  const live = (rs.json.source?.files || [])
    .map((f) => f.content)
    .join("\n");

  const local = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");

  console.log(`live ruleset : ${rulesetId}`);
  console.log(`live lines   : ${live.split("\n").length}`);
  console.log(`live bytes   : ${live.length}`);
  console.log(`identical to local file: ${live.trim() === local.trim()}`);

  console.log("\n=== hardcoded admin emails in the LIVE rules ===");
  let found = 0;
  for (const e of OLD_EMAILS) {
    if (live.includes(e)) {
      console.log(`  STILL PRESENT: ${e}`);
      found++;
    }
  }
  if (!found) console.log("  none - clean");

  const dupes = [...live.matchAll(/^\s*function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm)]
    .map((m) => m[1])
    .filter((n, i, a) => a.indexOf(n) !== i);
  console.log("\n=== duplicate function names in the LIVE rules ===");
  console.log(dupes.length ? `  ${[...new Set(dupes)].join(", ")}` : "  none - clean");

  console.log("\n=== self-promotion guard present? ===");
  console.log("  role immutable for non-admin:", /role[\s\S]{0,200}isAdmin\(\)/.test(live) ? "yes" : "not detected");
  process.exit(0);
}

main().catch((e) => {
  console.error("fatal:", e.message);
  process.exit(1);
});
