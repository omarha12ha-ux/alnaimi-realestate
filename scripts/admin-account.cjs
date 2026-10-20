// Administrator maintenance for the single-owner account.
//
// It does three things, all through the service account in secrets/sa.json:
//
//   node scripts/admin-account.cjs audit
//       Lists every account that still holds an administrator role, whether it
//       comes from a signed custom claim or from the role stored on the user
//       document in Firestore.
//
//   node scripts/admin-account.cjs set-password <password>
//       Sets a new password for the owner account. The application has no
//       password-change screen, and the project has no SMTP server, so a
//       reset e-mail cannot be delivered. This is the only way to get back
//       in when the password is lost.
//
//   node scripts/admin-account.cjs revoke <email>
//       Removes the administrator role from an account and deletes it, so a
//       former owner cannot reach the administration screens.

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const sa = JSON.parse(fs.readFileSync(path.join(root, "secrets", "sa.json"), "utf8"));
const cfg = JSON.parse(fs.readFileSync(path.join(root, "firebase-applet-config.json"), "utf8"));

const OWNER_EMAIL = "omarha12ha@gmail.com";

async function boot() {
  const admin = (await import("firebase-admin")).default;
  const { getAuth } = await import("firebase-admin/auth");
  const { getFirestore } = await import("firebase-admin/firestore");
  const mk = admin.credential ? admin.credential.cert : admin.cert;
  const app = admin.initializeApp({ credential: mk(sa), projectId: cfg.projectId });
  return {
    getAuth: () => getAuth(app),
    db: getFirestore(app, cfg.firestoreDatabaseId),
  };
}

async function audit() {
  const { getAuth, db } = await boot();
  const auth = getAuth();
  const users = (await auth.listUsers(200)).users;

  const claimAdmins = users.filter((u) => u.customClaims && u.customClaims.admin === true);

  const snap = await db.collection("users").get();
  const profileAdmins = [];
  for (const doc of snap.docs) {
    const data = doc.data() || {};
    if (data.role === "admin") {
      profileAdmins.push({ uid: doc.id, email: data.email });
    }
  }

  console.log("custom-claim administrators:");
  for (const u of claimAdmins) {
    console.log(`  ${u.email}  uid=${u.uid}`);
  }
  console.log("\nprofile-role administrators (users collection):");
  for (const p of profileAdmins) {
    console.log(`  ${p.email || "(no email)"}  uid=${p.uid}`);
  }
  console.log(`\naccounts total: ${users.length}`);
}

async function setPassword(password) {
  const { getAuth } = await boot();
  const auth = getAuth();
  const user = await auth.getUserByEmail(OWNER_EMAIL);
  await auth.updateUser(user.uid, { password });
  console.log(`password updated for ${OWNER_EMAIL}`);
}

async function revoke(email) {
  const { getAuth, db } = await boot();
  const auth = getAuth();
  const user = await auth.getUserByEmail(email);
  await auth.deleteUser(user.uid);
  await db.collection("users").doc(user.uid).delete().catch(() => {});
  console.log(`removed ${email}`);
}

(async () => {
  const [command, argument] = process.argv.slice(2);
  if (command === "audit") return audit();
  if (command === "set-password") {
    if (!argument || argument.length < 8) {
      console.error("give a password of at least 8 characters");
      process.exit(1);
    }
    return setPassword(argument);
  }
  if (command === "revoke") {
    if (!argument) {
      console.error("give the email to remove");
      process.exit(1);
    }
    return revoke(argument);
  }
  console.log("usage: node scripts/admin-account.cjs audit | set-password <password> | revoke <email>");
  process.exit(1);
})().catch((e) => {
  console.error("failed:", e.message);
  process.exit(1);
});
