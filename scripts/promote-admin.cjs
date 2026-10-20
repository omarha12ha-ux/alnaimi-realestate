/**
 * Promotes one account to administrator, through BOTH mechanisms the app
 * relies on, and is safe to re-run.
 *
 * Why both are needed:
 *   - the `admin` custom claim is a signed token input, checked by the API
 *     server and by `firestore.rules`;
 *   - `users/{uid}.role` is what the already-deployed rules read, so changing
 *     the claim alone would not change what the live site does today.
 *
 * Usage:
 *   node scripts/promote-admin.cjs <email> [--demote <email,email,...>]
 */
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

const DATABASE_ID = 'ai-studio-103a56d2-a888-4d96-8ce9-303c51e1cfcc';
const app = initializeApp({ credential: applicationDefault() }, 'promote');

const args = process.argv.slice(2);
const target = args[0];
const demoteIdx = args.indexOf('--demote');
const demoteList =
  demoteIdx !== -1 && args[demoteIdx + 1] ? args[demoteIdx + 1].split(',').map((s) => s.trim().toLowerCase()) : [];

if (!target) {
  console.error('usage: node scripts/promote-admin.cjs <email> [--demote a,b]');
  process.exit(1);
}

(async () => {
  const auth = getAuth(app);
  const db = getFirestore(app, DATABASE_ID);

  const user = await auth.getUserByEmail(target);
  console.log('target:', target, '| uid:', user.uid);

  const existing = user.customClaims || {};
  await auth.setCustomUserClaims(user.uid, { ...existing, admin: true });
  const after = await auth.getUser(user.uid);
  console.log('claim now:', JSON.stringify(after.customClaims));

  await db.collection('users').doc(user.uid).set(
    { email: target.toLowerCase(), role: 'admin' },
    { merge: true }
  );
  const doc = await db.collection('users').doc(user.uid).get();
  console.log('stored role now:', doc.get('role'));

  for (const email of demoteList) {
    try {
      const u = await auth.getUserByEmail(email);
      const claims = u.customClaims || {};
      if (claims.admin) {
        await auth.setCustomUserClaims(u.uid, { ...claims, admin: false });
        console.log('claim cleared for', email);
      } else {
        console.log('no admin claim on', email, '(nothing to clear)');
      }
      await db.collection('users').doc(u.uid).set({ role: 'client' }, { merge: true });
      console.log('  demoted to client:', email);
    } catch (e) {
      console.log('  skipped', email, '-', e.code || e.message);
    }
  }

  process.exit(0);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
