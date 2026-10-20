/**
 * Removes any throwaway probe accounts created while checking whether the
 * Email/Password provider is enabled. Deletes only addresses matching the
 * probe pattern, so real accounts are never touched.
 */
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const app = initializeApp({ credential: applicationDefault() }, 'cleanup');

(async () => {
  const auth = getAuth(app);
  let pageToken;
  let removed = 0;
  let scanned = 0;

  do {
    const res = await auth.listUsers(1000, pageToken);
    scanned += res.users.length;
    for (const u of res.users) {
      if (/^probe-check-\d+@example\.com$/.test(u.email || '')) {
        await auth.deleteUser(u.uid);
        console.log('deleted probe account:', u.email);
        removed += 1;
      }
    }
    pageToken = res.pageToken;
  } while (pageToken);

  console.log('scanned:', scanned, '| probes removed:', removed);
  process.exit(0);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
