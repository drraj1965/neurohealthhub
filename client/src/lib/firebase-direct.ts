import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Safe initialization for Direct Operations App
const directApp = getApps().find(app => app.name === "DirectOperations") 
  ? getApp("DirectOperations") 
  : initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }, "DirectOperations");

const directAuth = getAuth(directApp);
const directDb = getFirestore(directApp);
const directStorage = getStorage(directApp);

export { directAuth, directDb, directStorage };

/**
 * Directly creates or updates a user in Firestore
 */
export async function directCreateUserInFirestore(userData: {
  uid: string;
  email: string | null;
  displayName?: string | null;
  firstName?: string;
  lastName?: string;
  isAdmin?: boolean;
  emailVerified?: boolean;
}): Promise<boolean> {
  try {
    console.log(`[DIRECT FIREBASE] Creating user record directly for: ${userData.uid}`);
    const userDocRef = doc(directDb, "users", userData.uid);
    const userDoc = await getDoc(userDocRef);

    const emailUsername = userData.email ? userData.email.split('@')[0] : 'user';

    await setDoc(userDocRef, {
      uid: userData.uid,
      email: userData.email,
      firstName: userData.firstName || emailUsername,
      lastName: userData.lastName || '',
      username: emailUsername,
      isAdmin: userData.isAdmin || false,
      emailVerified: userData.emailVerified ?? true,
      createdAt: userDoc.exists() ? userDoc.data().createdAt : Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });

    console.log(`[DIRECT FIREBASE] Successfully ${userDoc.exists() ? 'updated' : 'created'} user in Firestore`);
    return true;
  } catch (error) {
    console.error('[DIRECT FIREBASE] Error creating user:', error);
    return false;
  }
}

export function getCurrentUser(): User | null {
  return directAuth.currentUser;
}

export async function checkFirestoreConnection(): Promise<boolean> {
  try {
    const testDocRef = doc(directDb, "connection_test", "test");
    await setDoc(testDocRef, { timestamp: Timestamp.now(), message: "Connection test" });
    console.log('[DIRECT FIREBASE] Firestore connection test successful');
    return true;
  } catch (error) {
    console.error('[DIRECT FIREBASE] Firestore connection test failed:', error);
    return false;
  }
}