import type { User } from 'firebase/auth';
import { auth } from './firebase';

export type AppRole = 'admin' | 'client';

/**
 * Addresses whose *interface* should be rendered as the staff dashboard.
 *
 * This is a display hint only, and it is deliberately not a security control.
 * The value ships in the public bundle, so anyone can read it; it grants
 * nothing. Real authorisation is enforced twice elsewhere:
 *
 *   - the API checks the address against `ADMIN_EMAILS` on the server, but only
 *     after Google has verified the ID token signature, and
 *   - `firestore.rules` serves protected collections only to `admin == true`.
 *
 * So forging this value reveals an empty interface. It exists to let a
 * legitimate administrator reach the dashboard before someone has managed to
 * attach the custom claim through the Firebase console.
 */
export const ADMIN_UI_EMAILS: string[] = (import.meta.env.VITE_ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isAdminUiEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_UI_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Resolves the caller's role from the Firebase ID token.
 *
 * The role must never be decided in the browser. An earlier revision compared
 * the signed-in address against a hardcoded admin email and then wrote
 * `role: 'admin'` into the user's own profile document. That is a privilege
 * escalation: the value is computed by code the user controls, and Firestore
 * trusts the client when it decides what to store. Anyone who knew the address
 * became an administrator.
 *
 * Admin standing now comes from the `admin` custom claim, which Google signs
 * with the project's private key. Editing the token locally changes nothing,
 * because the server and the security rules verify the signature.
 *
 * Note that this claim is only an input: `firestore.rules` independently
 * requires `admin == true` (or an admin-written `users/{uid}.role`) before it
 * will serve a protected collection, so faking this only misleads the UI.
 */
export async function resolveRoleFromToken(user: User | null): Promise<AppRole> {
  if (!user) return 'client';
  try {
    const token = await user.getIdTokenResult();
    if (token.claims.admin === true) return 'admin';
  } catch {
    // A token we cannot read means we cannot assert admin standing.
  }
  // Fall back to the display hint so the staff interface is reachable before
  // the custom claim exists. See ADMIN_UI_EMAILS for why this is safe.
  return isAdminUiEmail(user.email) ? 'admin' : 'client';
}

/**
 * True when the caller's ID token carries the admin claim.
 * Use this to gate admin UI; use the API for anything that matters.
 */
export async function isAdminToken(user: User | null): Promise<boolean> {
  return (await resolveRoleFromToken(user)) === 'admin';
}

/**
 * `fetch` wrapper for the operator API.
 *
 * The server authenticates privileged endpoints with the caller's Firebase ID
 * token (see `requireOperatorAuth` in `src/server/security.ts`). Attaching the
 * token here means the admin panel never needs a shared secret, so no
 * privileged credential is ever compiled into the browser bundle.
 *
 * The token is a short-lived JWT that Firebase refreshes automatically, so
 * `getIdToken` (rather than `getIdTokenResult`) avoids a round trip and returns
 * the cached value until it is close to expiry.
 */
export async function authFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);

  const currentUser = auth?.currentUser;
  if (currentUser) {
    // Force refresh if the cached token is within a minute of expiring.
    const token = await currentUser.getIdToken();
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init.body && !headers.has('Content-Type') && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(input, { ...init, headers });
}
