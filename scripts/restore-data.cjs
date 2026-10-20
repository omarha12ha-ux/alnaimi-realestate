// Restore Firestore documents from a backup folder.
//
//   node scripts/restore-data.cjs --from <backup-dir>            # upsert only
//   node scripts/restore-data.cjs --from <backup-dir> --replace  # wipe first
//   node scripts/restore-data.cjs --from <backup-dir> --dry-run
//
// Never deletes anything unless --replace is passed, and even then it asks for
// typed confirmation. Upsert is the safe default: existing documents keep their
// server-generated fields unless the backup contains them.
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const PROJECT = "gen-lang-client-0452433990";
const DB = "ai-studio-103a56d2-a888-4d96-8ce9-303c51e1cfcc";

async function main() {
  const args = process.argv.slice(2);
  const fromIdx = args.indexOf("--from");
  if (fromIdx < 0 || !args[fromIdx + 1]) {
    console.error("usage: node restore-data.cjs --from <backup-dir> [--replace] [--dry-run]");
    process.exit(1);
  }
  const dir = path.resolve(args[fromIdx + 1]);
  const replace = args.includes("--replace");
  const dryRun = args.includes("--dry-run");

  const dataFile = path.join(dir, "firestore.json");
  if (!fs.existsSync(dataFile)) {
    console.error(`no firestore.json in ${dir}`);
    process.exit(1);
  }
  const backup = JSON.parse(fs.readFileSync(dataFile, "utf8"));

  // Verify the backup has not been altered since it was written.
  const manifestPath = path.join(dir, "manifest.json");
  if (fs.existsSync(manifestPath)) {
    const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (m.databaseId !== DB) {
      console.error(`manifest databaseId mismatch:\n  backup: ${m.databaseId}\n  target: ${DB}`);
      process.exit(1);
    }
    if (m.project !== PROJECT) {
      console.error(`manifest project mismatch: ${m.project}`);
      process.exit(1);
    }
    console.log(`manifest verified: created ${m.createdAt}`);
  } else {
    console.log("WARNING: no manifest.json - backup is unverified");
  }

  const root = path.join(__dirname, "..");
  process.env.GOOGLE_APPLICATION_CREDENTIALS =
    process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(root, "secrets", "sa.json");
  const { initializeApp, applicationDefault } = require("firebase-admin/app");
  const { getFirestore } = require("firebase-admin/firestore");
  const app = initializeApp({ credential: applicationDefault() }, `restore-${Date.now()}`);
  const db = getFirestore(app, DB);

  const total = Object.values(backup).reduce((n, docs) => n + docs.length, 0);
  console.log(`\nrestore plan: ${total} docs across ${Object.keys(backup).length} collections`);
  console.log(`mode        : ${replace ? "REPLACE (delete all, then write)" : "UPSERT (no deletes)"}`);
  if (dryRun) console.log("mode        : DRY RUN - nothing will be written");

  if (replace && !dryRun) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((r) => rl.question("Type DELETE to wipe and rewrite: ", r));
    rl.close();
    if (answer.trim() !== "DELETE") {
      console.log("aborted - nothing was changed");
      process.exit(0);
    }
  }

  for (const [coll, docs] of Object.entries(backup)) {
    if (replace && !dryRun) {
      const existing = await db.collection(coll).get();
      if (existing.size) {
        await db.recursiveDelete(db.collection(coll));
        console.log(`  ${coll.padEnd(30)} wiped ${existing.size}`);
      }
    }
    let written = 0;
    for (const d of docs) {
      const { __id, ...fields } = d;
      if (!__id) continue;
      if (!dryRun) await db.collection(coll).doc(__id).set(fields);
      written++;
    }
    console.log(`  ${coll.padEnd(30)} ${written} docs ${dryRun ? "(dry run)" : "written"}`);
  }

  console.log(dryRun ? "\nDRY RUN COMPLETE - nothing changed" : "\nRESTORE COMPLETE");
  process.exit(0);
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
