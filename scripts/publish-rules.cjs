// Publish firestore.rules to the project's custom Firestore database.
//
// Mechanism mirrors firebase-tools' own deploy path (lib/rulesDeploy.js +
// lib/gcp/rules.js):
//   1. POST /v1/projects/{p}/rulesets      with `attachment_point`
//   2. POST /v1/projects/{p}/releases      with release name
//      `cloud.firestore/{databaseId}`
const fs = require("fs");
const path = require("path");
const { JWT } = require("google-auth-library");

const PROJECT = "gen-lang-client-0452433990";
const NUMBER = "238794968083";
const DB = "ai-studio-103a56d2-a888-4d96-8ce9-303c51e1cfcc";
const API = "https://firebaserules.googleapis.com/v1";
const RELEASE = `cloud.firestore/${DB}`;

async function main() {
  const root = path.join(__dirname, "..");
  const sa = JSON.parse(fs.readFileSync(path.join(root, "secrets", "sa.json"), "utf8"));
  const { token } = await new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  }).getAccessToken();

  const call = async (method, url, body) => {
    const r = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const t = await r.text();
    let j = null;
    try {
      j = JSON.parse(t);
    } catch {}
    return { status: r.status, text: t, json: j };
  };

  // ---- what is released right now? -----------------------------------------
  const before = await call("GET", `${API}/projects/${PROJECT}/releases?pageSize=100`);
  console.log("=== existing releases ===");
  for (const rel of before.json?.releases || []) {
    console.log(`  ${rel.name}`);
    console.log(`      ruleset: ${(rel.rulesetName || "").split("/").pop()}`);
  }

  // ---- 1. upload the ruleset ----------------------------------------------
  const source = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
  const created = await call("POST", `${API}/projects/${PROJECT}/rulesets`, {
    source: { files: [{ name: "firestore.rules", content: source }] },
    attachment_point: `firestore.googleapis.com/projects/${NUMBER}/databases/${DB}`,
  });
  if (created.status !== 200) {
    console.log(`\n[${created.status}] create ruleset FAILED`);
    console.log("   ", created.text.slice(0, 400).replace(/\s+/g, " "));
    process.exit(1);
  }
  const rulesetName = created.json.name;
  console.log(`\nruleset uploaded: ${rulesetName}`);

  // ---- 2. release it to the database --------------------------------------
  const fullName = `projects/${PROJECT}/releases/${RELEASE}`;
  const rel = await call("POST", `${API}/projects/${PROJECT}/releases`, {
    name: fullName,
    rulesetName,
  });

  let ok = false;
  if (rel.status === 200) {
    console.log(`[200] created release`);
    ok = true;
  } else {
    console.log(`[${rel.status}] create release -> `, rel.text.slice(0, 160).replace(/\s+/g, " "));
    // Existing release -> PATCH. The update payload is nested under `release`;
    // a flat {name, rulesetName} is rejected with "Cannot find field".
    const upd = await call("PATCH", `${API}/projects/${PROJECT}/releases/${RELEASE}`, {
      release: { name: fullName, rulesetName },
    });
    console.log(`[${upd.status}] PATCH release`);
    console.log("   ", upd.text.slice(0, 300).replace(/\s+/g, " "));
    ok = upd.status === 200;
  }
  if (ok) {
    console.log(`\n[${rel.status}] release published -> ${RELEASE}`);
  }

  // ---- 3. verify what is live now -----------------------------------------
  const after = await call("GET", `${API}/projects/${PROJECT}/releases?pageSize=100`);
  console.log("\n=== releases after ===");
  for (const r of after.json?.releases || []) {
    const isOurs = (r.rulesetName || "") === rulesetName;
    console.log(`  ${isOurs ? "=>" : "  "} ${r.name}`);
    console.log(`      ${(r.rulesetName || "").split("/").pop()}`);
  }
  const live = (after.json?.releases || []).some((r) => r.rulesetName === rulesetName);
  console.log(live ? "\nVERIFIED: live rules == the fixed local file" : "\nNOT yet live");
  process.exit(live ? 0 : 2);
}

main().catch((e) => {
  console.error("fatal:", e.message);
  process.exit(1);
});
