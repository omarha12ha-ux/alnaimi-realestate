// Lists the Firebase Auth accounts of the project and shows which of them are
// administrators. Run it when a sign-in or a role looks wrong:
//
//   node scripts/list-users.cjs
//
// It reads the service account from secrets/sa.json and prints nothing that
// could be used to sign in: only the address, the uid, and the claims.

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const sa = JSON.parse(fs.readFileSync(path.join(root, "secrets", "sa.json"), "utf8"));
const cfg = JSON.parse(fs.readFileSync(path.join(root, "firebase-applet-config.json"), "utf8"));

(async () => {
  const admin = (await import("firebase-admin")).default;
  const { getAuth } = await import("firebase-admin/auth");
  // firebase-admin v14 exposes the credential factory as `cert`; older
  // versions exposed it as `credential.cert`.
  const makeCredential = admin.credential ? admin.credential.cert : admin.cert;
  admin.initializeApp({
    credential: makeCredential(sa),
    projectId: cfg.projectId,
  });

  const list = await getAuth().listUsers(200);
  console.log("project:", cfg.projectId);
  console.log("total accounts:", list.users.length, "\n");

  for (const u of list.users) {
    const claims = u.customClaims || {};
    const isAdmin = claims.admin === true;
    console.log(
      `  ${u.email || "(no email)"}` +
        `  uid=${u.uid}` +
        `  verified=${u.emailVerified}` +
        `  disabled=${!!u.disabled}` +
        `  adminClaim=${isAdmin}`
    );
  }

  process.exit(0);
})().catch((e) => {
  console.error("failed:", e.message);
  process.exit(1);
});
