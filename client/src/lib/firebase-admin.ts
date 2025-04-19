import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

let firebaseAdminApp: FirebaseApp | null = null;

// Get Firebase Admin app instance
export const getFirebaseAdminApp = (): FirebaseApp => {
  if (!firebaseAdminApp) {
    // Initialize Firebase admin app with the same config as the client app
    // but with different name to avoid conflicts
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    
    firebaseAdminApp = initializeApp(firebaseConfig, "admin");
    
    // In development, connect to Firebase Auth Emulator if it's available
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
  
  return firebaseAdminApp;
};

// Define interfaces for our Firebase Auth user records
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

// List all Firebase users (simplified for client-side)
// Note: In production, this should be done server-side with Firebase Admin SDK
export const getFirebaseUsers = async (): Promise<UserRecord[]> => {
  try {
    const adminApp = getFirebaseAdminApp();
    const auth = getAuth(adminApp);
    
    // We would use admin.auth().listUsers() in a real server implementation
    // For client-side, we're creating a placeholder that returns empty array
    // as this functionality is only available in the Admin SDK
    
    // Mock implementation for demonstration
    console.log("Attempting to fetch Firebase Auth users (client-side mock)");
    
    // In a real implementation with proper backend:
    // const { users } = await auth.listUsers(1000);
    // return users;
    
    // For now, return an empty array with a message to implement server-side
    return [];
  } catch (error) {
    console.error("Error listing Firebase users:", error);
    return [];
  }
};

// Get user details from Firebase Auth by UID
export const getFirebaseUserByUid = async (uid: string): Promise<UserRecord | null> => {
  try {
    // This would use admin.auth().getUser(uid) in a real implementation
    // For client-side, we're returning null
    console.log(`Attempting to fetch Firebase Auth user by UID: ${uid} (client-side mock)`);
    return null;
  } catch (error) {
    console.error(`Error getting Firebase user by UID ${uid}:`, error);
    return null;
  }
};

// Get user details from Firebase Auth by email
export const getFirebaseUserByEmail = async (email: string): Promise<UserRecord | null> => {
  try {
    // This would use admin.auth().getUserByEmail(email) in a real implementation
    // For client-side, we're returning null
    console.log(`Attempting to fetch Firebase Auth user by email: ${email} (client-side mock)`);
    return null;
  } catch (error) {
    console.error(`Error getting Firebase user by email ${email}:`, error);
    return null;
  }
};