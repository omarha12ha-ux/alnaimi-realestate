// Prints the environment variables in the exact KEY=VALUE lines Render needs,
// plus pre-checks that would otherwise surface as confusing deploy failures.
// Run it locally, copy the output into Render's dashboard by hand, then delete
// nothing on our side: this script does not write anywhere.
//
//   node scripts/show-render-env.cjs
//
// It reads the same .env the dev server uses, so what you paste is guaranteed
// to match what runs here.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");

const REQUIRED = [
  "ADMIN_API_TOKEN",
  "ADMIN_EMAILS",
  "BOOKING_FEE_CENTS",
  "FIREBASE_SERVICE_EMAIL",
  "FIREBASE_SERVICE_PASSWORD",
  "INTERNAL_API_TOKEN",
  "SENDER_WHATSAPP_NUMBER",
  "STRIPE_CURRENCY",
  "VITE_ADMIN_EMAILS",
  "WHATSAPP_PROVIDER",
];

const envFile = join(repoRoot, ".env");
const problems = [];

if (!existsSync(envFile)) {
  problems.push(".env is missing at the repo root. Copy .env.example and fill it in first.");
  process.exitCode = 1;
} else {
  const raw = readFileSync(envFile, "utf8");
  const vars = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }

  console.log("# Paste these into Render: Dashboard -> your service -> Environment");
  console.log("# then Save. Required values for a working deploy:\n");
  for (const key of REQUIRED) {
    if (!(key in vars)) {
      problems.push(`${key} is missing from .env`);
      console.log(`${key}=`);
      continue;
    }
    console.log(`${key}=${vars[key]}`);
  }

  const optional = ["GEMINI_API_KEY", "GOOGLE_MAPS_PLATFORM_KEY", "DISABLE_HMR"];
  const has = optional.filter((k) => vars[k]);
  if (has.length) {
    console.log("\n# Optional but present in your .env (add them too if you use them):");
    for (const k of has) console.log(`${k}=${vars[k]}`);
  }
}

console.log("\n# Recommendations:");
console.log("#   Region        : Frankfurt (closest to the Levant)");
console.log("#   Health Check  : /api/health");
console.log("#   Disk          : none on free plan — uploaded files are recalimed on redeploy.");
console.log("#   Instance type : start Free; upgrade to Starter ($7/mo) to avoid cold starts.");

if (problems.length) {
  console.error("\nPROBLEMS:\n - " + problems.join("\n - "));
  process.exitCode = 1;
} else {
  console.log("\nOK: all required variables are present in .env.");
}