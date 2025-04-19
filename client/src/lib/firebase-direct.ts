/**
 * Direct Firebase operations module
 * This provides direct connections to Firebase services for critical operations
 * when the API routes might fail due to connectivity issues
 */

import { initializeApp } from "firebase/app";
import { getAuth, User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, Timestamp } from "firebase/firestore";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: "123456789", // Default value, not critical
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase - separate initialization to avoid circular references
const directApp = initializeApp(firebaseConfig, "DirectOperations");
const directAuth = getAuth(directApp);
const directDb = getFirestore(directApp);

/**
 * Directly creates or updates a user in Firestore
 * This bypasses the server API entirely
 */
export async function directCreateUserInFirestore(
  userData: {
    uid: string;
    email: string | null;
    displayName?: string | null;
    firstName?: string;
    lastName?: string;
    isAdmin?: boolean;
    emailVerified?: boolean;
  }
): Promise<boolean> {
  try {
    console.log(`[DIRECT FIREBASE] Creating user record directly for: ${userData.uid}`);
    
    // Check if user already exists
    const userDocRef = doc(directDb, "users", userData.uid);
    const userDoc = await getDoc(userDocRef);
    
    // Get email username for defaults
    const emailUsername = userData.email ? userData.email.split('@')[0] : 'user';
    
    // Prepare user data with defaults
    const userDataForDb = {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName || null,
      firstName: userData.firstName || (userData.displayName ? userData.displayName.split(' ')[0] : emailUsername),
      lastName: userData.lastName || (userData.displayName ? userData.displayName.split(' ').slice(1).join(' ') : ''),
      username: emailUsername,
      isAdmin: userData.isAdmin || false,
      emailVerified: userData.emailVerified || true,
      createdAt: userDoc.exists() ? userDoc.data().createdAt : Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    // Save to Firestore
    await setDoc(userDocRef, userDataForDb, { merge: true });
    console.log(`[DIRECT FIREBASE] Successfully ${userDoc.exists() ? 'updated' : 'created'} user in Firestore`);
    
    return true;
  } catch (error: any) {
    console.error('[DIRECT FIREBASE] Error creating user:', error);
    
    // Check if this is an offline or connectivity error
    if (error && error.code && (error.code === 'unavailable' || error.code === 'resource-exhausted')) {
      console.log('[DIRECT FIREBASE] Connectivity error detected. Retrying once after 3s...');
      
      // Add a simple retry after a delay
      return new Promise((resolve) => {
        setTimeout(async () => {
          try {
            const userDocRef = doc(directDb, "users", userData.uid);
            await setDoc(userDocRef, {
              uid: userData.uid,
              email: userData.email,
              firstName: userData.firstName || 'User',
              lastName: userData.lastName || '',
              isAdmin: userData.isAdmin || false,
              emailVerified: true,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            }, { merge: true });
            console.log('[DIRECT FIREBASE] Retry successful!');
            resolve(true);
          } catch (retryError) {
            console.error('[DIRECT FIREBASE] Retry failed:', retryError);
            resolve(false);
          }
        }, 3000);
      });
    }
    
    return false;
  }
}

/**
 * Get the currently authenticated user 
 */
export function getCurrentUser(): User | null {
  return directAuth.currentUser;
}

/**
 * Check if Firestore is accessible directly
 */
export async function checkFirestoreConnection(): Promise<boolean> {
  try {
    // Try to access a test collection
    const testDocRef = doc(directDb, "connection_test", "test");
    await setDoc(testDocRef, { 
      timestamp: Timestamp.now(),
      message: "Connection test" 
    });
    console.log('[DIRECT FIREBASE] Firestore connection test successful');
    return true;
  } catch (error) {
    console.error('[DIRECT FIREBASE] Firestore connection test failed:', error);
    return false;
  }
}