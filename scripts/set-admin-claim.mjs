/**
 * Grants (or revokes) the `admin` custom claim on a Firebase Auth user.
 *
 * The security rules identify administrators by this signed claim rather than
 * by an email address embedded in the rules file. A claim lives inside the ID
 * token and is signed by Google's private key, so the client cannot forge it,
 * and the rules file no longer publishes who runs the company.
 *
 * Usage:
 *   node scripts/set-admin-claim.mjs <email-or-uid> [--revoke]
 *   node scripts/set-admin-claim.mjs <email> --key C:\path\to\service-account.json
 *
 * Credentials are resolved in this order:
 *   1. --key <path>                     (explicit service account file)
 *   2. FIREBASE_SERVICE_ACCOUNT_JSON    (raw JSON in an env var, for CI)
 *   3. GOOGLE_APPLICATION_CREDENTIALS   (path in an env var)
 *   4. Application Default Credentials  (`firebase login`)
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function loadFirebaseConfig() {
  const configPath = path.join(projectRoot, "firebase-applet-config.json");
  try {
    return JSON.parse(readFileSync(configPath, "utf8"));
  } catch (err) {
    console.error(`Cannot read ${configPath}: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Resolves the service account credential from --key, an env var, or ADC.
 * Returns `undefined` to fall through to Application Default Credentials.
 */
function resolveCredential(args) {
  const keyIndex = args.indexOf("--key");
  if (keyIndex !== -1) {
    const keyPath = args[keyIndex + 1];
    if (!keyPath) {
      console.error("--key requires a path to the service account JSON file.");
      process.exit(1);
    }
    const resolved = path.resolve(keyPath);
    if (!existsSync(resolved)) {
      console.error(`Service account file not found: ${resolved}`);
      process.exit(1);
    }
    return cert(JSON.parse(readFileSync(resolved, "utf8")));
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const fromEnv = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    if (existsSync(fromEnv)) {
      return cert(JSON.parse(readFileSync(fromEnv, "utf8")));
    }
    console.warn(
      `GOOGLE_APPLICATION_CREDENTIALS points at ${fromEnv}, which does not exist.`
    );
  }

  return undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const target = args.find((a) => !a.startsWith("--") && a !== args[args.indexOf("--key") + 1]);
  const revoke = args.includes("--revoke");
  const create = args.includes("--create");
  const password = (() => {
    const i = args.indexOf("--password");
    return i !== -1 ? args[i + 1] : undefined;
  })();

  if (!target) {
    console.error(
      "Usage: node scripts/set-admin-claim.mjs <email-or-uid> [--revoke] [--create --password <pw>] [--key <service-account.json>]"
    );
    process.exit(1);
  }

  const firebaseConfig = loadFirebaseConfig();

  if (getApps().length === 0) {
    initializeApp({
      credential: resolveCredential(args),
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
    });
  }

  const auth = getAuth();
  const claims = { admin: !revoke };

  try {
    let user;
    try {
      user = target.includes("@")
        ? await auth.getUserByEmail(target)
        : await auth.getUser(target);
    } catch (err) {
      // A missing account is only fatal when we were not asked to create it.
      if (!create || !target.includes("@")) throw err;
      if (!password) {
        console.error(
          "Account not found. Re-run with --create --password <password> to provision it."
        );
        process.exit(1);
      }
      user = await auth.createUser({
        email: target,
        password,
        emailVerified: true,
        disabled: false,
      });
      console.log(`Created Firebase Auth account for ${user.email} (uid: ${user.uid}).`);
    }

    await auth.setCustomUserClaims(user.uid, claims);
    console.log(
      `✅ ${revoke ? "Revoked" : "Granted"} admin claim for ${user.email || user.uid} (uid: ${user.uid}).`
    );
    console.log(
      "   The user must sign out and sign back in for the new token to take effect."
    );
  } catch (err) {
    console.error(`❌ Failed: ${err.message}`);
    process.exit(1);
  }
}

main();
