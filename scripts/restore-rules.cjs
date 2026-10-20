// Point the Firestore rules release at any ruleset that already exists.
// This is the rollback mechanism: no ruleset upload, no compilation, just a
// release pointer swap. Verified both directions before it is ever needed.
//
//   node scripts/restore-rules.cjs --to <rulesetId>
//   node scripts/restore-rules.cjs --show
const fs = require("fs");
const path = require("path");
const { JWT } = require("google-auth-library");

const PROJECT = "gen-lang-client-0452433990";
const DB = "ai-studio-103a56d2-a888-4d96-8ce9-303c51e1cfcc";
const API = "https://firebaserules.googleapis.com/v1";
const RELEASE = `cloud.firestore/${DB}`;

async function main() {
  const args = process.argv.slice(2);
  const show = args.includes("--show");
  const toIdx = args.indexOf("--to");
  const target = toIdx >= 0 ? args[toIdx + 1] : null;

  const root = path.join(__dirname, "..");
  const sa = JSON.parse(fs.readFileSync(path.join(root, "secrets", "sa.json"), "utf8"));
  const { token } = await new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  }).getAccessToken();
  const H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const getJson = async (url) => (await fetch(url, { headers: H })).json();

  // ---- show current state --------------------------------------------------
  const rel = await getJson(`${API}/projects/${PROJECT}/releases?pageSize=100`);
  const current = (rel.releases || []).find((r) => r.name.endsWith(`/releases/${RELEASE}`));
  console.log("database      :", DB);
  console.log("release       :", RELEASE);
  console.log("live ruleset  :", current ? current.rulesetName.split("/").pop() : "(none)");

  if (show || !target) {
    console.log("\n=== all rulesets (any of these can be restored) ===");
    const all = await getJson(`${API}/projects/${PROJECT}/rulesets?pageSize=100`);
    for (const r of all.rulesets || []) {
      const id = r.name.split("/").pop();
      const isLive = current && current.rulesetName.endsWith(id);
      const content = (r.source?.files || []).map((f) => f.content).join("");
      const emails = (content.match(/[\w.+-]+@[\w-]+\.[a-z.]+/gi) || []).filter((e) =>
        ["tlasalbaraa", "aaadddnnnaaannn0", "admin-server-reminder"].some((x) => e.includes(x))
      );
      console.log(`  ${isLive ? "LIVE " : "     "}${id}  ${r.createTime}  ${content.split("\n").length} lines${emails.length ? "  [contains old admin emails]" : ""}`);
    }
    if (!target) {
      console.log("\nPass --to <rulesetId> to roll back.");
      process.exit(0);
    }
  }

  // ---- validate the target exists -----------------------------------------
  const t = await getJson(`${API}/projects/${PROJECT}/rulesets/${target}`);
  if (t.error) {
    console.error(`\ntarget ruleset ${target} does not exist: ${t.error.message}`);
    process.exit(1);
  }
  const content = (t.source?.files || []).map((f) => f.content).join("");
  console.log(`\ntarget        : ${target}  (${content.split("\n").length} lines)`);

  // ---- swap ----------------------------------------------------------------
  const r = await fetch(`${API}/projects/${PROJECT}/releases/${RELEASE}`, {
    method: "PATCH",
    headers: H,
    body: JSON.stringify({
      release: { name: `projects/${PROJECT}/releases/${RELEASE}`, rulesetName: `projects/${PROJECT}/rulesets/${target}` },
    }),
  });
  const body = await r.text();
  console.log(`[${r.status}] swap release`);
  if (r.status !== 200) {
    console.log("   ", body.slice(0, 300).replace(/\s+/g, " "));
    process.exit(1);
  }

  // ---- verify --------------------------------------------------------------
  const after = await getJson(`${API}/projects/${PROJECT}/releases?pageSize=100`);
  const now = (after.releases || []).find((x) => x.name.endsWith(`/releases/${RELEASE}`));
  const live = now ? now.rulesetName.split("/").pop() : "(none)";
  console.log(`live ruleset  : ${live}`);
  console.log(live === target ? "\nROLLBACK/APPLY VERIFIED" : "\nFAILED - live pointer did not change");
  process.exit(live === target ? 0 : 1);
}

main().catch((e) => {
  console.error("fatal:", e.message);
  process.exit(1);
});
