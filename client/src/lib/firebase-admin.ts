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

// List all Firebase users by connecting to our server API endpoints
export const getFirebaseUsers = async (): Promise<UserRecord[]> => {
  try {
    console.log("Fetching Firebase Auth users from server API");
    
    const response = await fetch('/api/firebase-auth/users');
    
    if (!response.ok) {
      console.error(`Server returned ${response.status}: ${response.statusText}`);
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    // Log the raw response text for debugging
    const responseText = await response.text();
    console.log("Firebase Auth API raw response:", responseText);
    
    // Parse the response if it's valid JSON
    let users: UserRecord[] = [];
    try {
      users = JSON.parse(responseText);
      console.log(`Successfully fetched ${users.length} Firebase Auth users:`, users);
    } catch (parseError) {
      console.error("Failed to parse API response as JSON:", parseError);
      return [];
    }
    
    return users;
  } catch (error) {
    console.error("Error listing Firebase users:", error);
    return [];
  }
};

// Get user details from Firebase Auth by UID
export const getFirebaseUserByUid = async (uid: string): Promise<UserRecord | null> => {
  try {
    console.log(`Fetching Firebase Auth user by UID: ${uid} from server API`);
    
    const response = await fetch(`/api/firebase-auth/users/${uid}`);
    
    if (response.status === 404) {
      console.log(`User with UID ${uid} not found`);
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    const user = await response.json();
    return user;
  } catch (error) {
    console.error(`Error getting Firebase user by UID ${uid}:`, error);
    return null;
  }
};

// Get user details from Firebase Auth by email
export const getFirebaseUserByEmail = async (email: string): Promise<UserRecord | null> => {
  try {
    console.log(`Fetching Firebase Auth user by email: ${email} from server API`);
    
    const response = await fetch(`/api/firebase-auth/users/email/${email}`);
    
    if (response.status === 404) {
      console.log(`User with email ${email} not found`);
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    const user = await response.json();
    return user;
  } catch (error) {
    console.error(`Error getting Firebase user by email ${email}:`, error);
    return null;
  }
};