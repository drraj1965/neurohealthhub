import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Safe initialization of Firebase Admin App
let firebaseAdminApp: FirebaseApp;

if (getApps().find(app => app.name === "admin")) {
  firebaseAdminApp = getApp("admin");
} else {
  firebaseAdminApp = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }, "admin");

  if (import.meta.env.DEV) {
    try {
      const auth = getAuth(firebaseAdminApp);
      connectAuthEmulator(auth, "http://localhost:9099");
      console.log("Connected to Firebase Auth Emulator");
    } catch (error) {
      console.error("Failed to connect to Firebase Auth Emulator:", error);
    }
  }
}

// Provide getter function
export const getFirebaseAdminApp = (): FirebaseApp => firebaseAdminApp;

// Define UserRecord interface
export interface UserRecord {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  photoURL: string | null;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  providerData?: any[];
}

// Fetch list of users
export const getFirebaseUsers = async (): Promise<UserRecord[]> => {
  try {
    const response = await fetch('/api/firebase-auth/users');
    if (!response.ok) throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("Error listing Firebase users:", error);
    return [];
  }
};

// Fetch user by UID
export const getFirebaseUserByUid = async (uid: string): Promise<UserRecord | null> => {
  try {
    const response = await fetch(`/api/firebase-auth/users/${uid}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error(`Error getting user by UID ${uid}:`, error);
    return null;
  }
};

// Fetch user by email
export const getFirebaseUserByEmail = async (email: string): Promise<UserRecord | null> => {
  try {
    const response = await fetch(`/api/firebase-auth/users/email/${email}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error(`Error getting user by email ${email}:`, error);
    return null;
  }
};