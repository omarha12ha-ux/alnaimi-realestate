/**
 * One-off audit: who can sign in, what admin claims do they hold, and what
 * roles are stored in Firestore. Prints no secret material.
 * Delete when the migration is finished.
 *
 * Note: firebase-admin v14 removed the `admin.credential.*` namespace, so the
 * app/auth/firestore entry points are imported from their submodules.
 */
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

const app = initializeApp({ credential: applicationDefault() }, 'audit');

(async () => {
  const users = await getAuth(app).listUsers(1000);
  console.log('auth users:', users.users.length);
  for (const u of users.users) {
    console.log(
      ' -',
      (u.email || '(no email)').padEnd(36),
      '| disabled=' + u.disabled,
      '| verified=' + u.emailVerified,
      '| claims=' + (u.customClaims ? JSON.stringify(u.customClaims) : '(none)')
    );
  }

  // This project does not use the default Firestore database; the id is
  // declared in firebase-applet-config.json. Asking for "(default)" returns
  // NOT_FOUND, which is why the console showed zero activity.
  const db = getFirestore(app, 'ai-studio-103a56d2-a888-4d96-8ce9-303c51e1cfcc');
  const snap = await db.collection('users').get();
  console.log('\nfirestore users/ docs:', snap.size);
  for (const d of snap.docs) {
    const data = d.data();
    console.log(' -', d.id, '| email=' + (data.email || '?'), '| role=' + (data.role ?? '(none)'));
  }

  for (const col of ['properties', 'appointments', 'deals', 'bookings']) {
    try {
      const s = await db.collection(col).limit(1).get();
      console.log('collection', col, '->', s.size === 0 ? 'empty' : 'has data');
    } catch (e) {
      console.log('collection', col, '-> error:', e.message.slice(0, 80));
    }
  }

  process.exit(0);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
