// Replicate exactly what an anonymous visitor's browser does: read the public
// collections through the Firestore JS SDK. A rules mistake shows up here as
// permission-denied, which is the difference between "site up" and "site broken".
const fs = require("fs");
const path = require("path");

async function main() {
  const root = path.join(__dirname, "..");
  const { initializeApp } = require("firebase/app");
  const { getFirestore, collection, getDocs, doc, getDoc, limit, query } = require("firebase/firestore");

  const cfg = JSON.parse(fs.readFileSync(path.join(root, "firebase-applet-config.json"), "utf8"));
  const apiKey = cfg.apiKey || process.env.VITE_FIREBASE_API_KEY;
  const projectId = cfg.projectId || process.env.VITE_FIREBASE_PROJECT_ID;
  const appId = cfg.appId || process.env.VITE_FIREBASE_APP_ID;
  const dbId =
    process.env.VITE_FIRESTORE_DB_ID || "ai-studio-103a56d2-a888-4d96-8ce9-303c51e1cfcc";

  const app = initializeApp({ apiKey, projectId, appId });
  const db = getFirestore(app, dbId);
  console.log("project :", projectId);
  console.log("database:", dbId, "\n");

  const checks = [
    ["properties", () => getDocs(query(collection(db, "properties"), limit(1)))],
    ["services", () => getDocs(query(collection(db, "services"), limit(1)))],
    ["reviews", () => getDocs(query(collection(db, "reviews"), limit(1)))],
    ["departments", () => getDocs(query(collection(db, "departments"), limit(1)))],
    ["companySettings", () => getDoc(doc(db, "companySettings", "main"))],
    ["appointments (must be DENIED)", () => getDocs(query(collection(db, "appointments"), limit(1)))],
    ["users (must be DENIED)", () => getDocs(query(collection(db, "users"), limit(1)))],
  ];

  for (const [label, fn] of checks) {
    const shouldDeny = /DENIED/.test(label);
    try {
      const s = await fn();
      const n = s && typeof s.size === "number" ? s.size : s.exists() ? 1 : 0;
      const ok = !shouldDeny;
      console.log(`  ${ok ? "OK  " : "WARN"} ${label.padEnd(30)} readable (${n})`);
    } catch (e) {
      const denied = /permission|insufficient|denied/i.test(e.message);
      const ok = shouldDeny ? denied : false;
      console.log(`  ${ok ? "OK  " : "FAIL"} ${label.padEnd(30)} ${denied ? "correctly denied" : e.message.slice(0, 80)}`);
    }
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("fatal:", e.message);
  process.exit(1);
});

