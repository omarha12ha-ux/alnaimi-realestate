import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Enforce long-lived browser local persistence for persistent authentication sessions
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Failed to enforce browser local persistence:", err);
});

// Use initializeFirestore with experimentalForceLongPolling to ensure client-server sync runs over standard HTTP POST/GET,
// enabling our global proxy handler in main.tsx to intercept and route Google Firestore requests through our Cloud Run backend.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
}, (firebaseConfig as any).firestoreDatabaseId);

async function testConnection() {
  try {
    // Only test if we are in the browser
    if (typeof window !== 'undefined') {
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("Firebase connection successful");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission-denied')) {
      // This is expected if the doc doesn't exist or rules block it
      console.log("Firebase connected (Permission denied as expected for test doc)");
    } else if (error instanceof Error && error.message.includes('the client is offline')) {
      console.log("Firebase connection test: client is currently offline. Will retry automatically.");
    } else {
      console.warn("Firebase connection test notice:", error);
    }
  }
}

testConnection();

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null): never {
  const authInfo = auth.currentUser ? {
    userId: auth.currentUser.uid,
    email: auth.currentUser.email || '',
    emailVerified: auth.currentUser.emailVerified,
    isAnonymous: auth.currentUser.isAnonymous,
    providerInfo: auth.currentUser.providerData.map(p => ({
      providerId: p.providerId,
      displayName: p.displayName || '',
      email: p.email || ''
    }))
  } : {
    userId: '',
    email: '',
    emailVerified: false,
    isAnonymous: true,
    providerInfo: []
  };

  const errorInfo: FirestoreErrorInfo = {
    error: error.message || String(error),
    operationType,
    path,
    authInfo
  };
  
  console.error("Firestore Error:", errorInfo);
  throw new Error(JSON.stringify(errorInfo));
}

export default app;
