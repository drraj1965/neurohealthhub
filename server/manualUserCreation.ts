import { initializeFirebaseAdmin } from './firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

/**
 * Helper function to manually create a user in Firestore after email verification
 * This can be called from the client to ensure a user is created after verification
 */
export async function createFirestoreUserRecord(
  uid: string, 
  email: string,
  firstName: string = '',
  lastName: string = ''
) {
  try {
    console.log(`Manually creating user record in Firestore for user: ${uid} (${email})`);
    
    // Initialize Firebase Admin
    initializeFirebaseAdmin();
    
    // Get Auth and Firestore instances
    const auth = getAuth();
    const firestore = getFirestore();
    
    // Check if user exists in Auth
    const userRecord = await auth.getUser(uid);
    
    if (!userRecord) {
      console.error(`User ${uid} does not exist in Firebase Auth`);
      return { success: false, message: 'User does not exist in Firebase Auth' };
    }
    
    // Check if the user already exists in Firestore
    const userDocRef = firestore.collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    
    if (userDoc.exists) {
      console.log(`User ${uid} already exists in Firestore`);
      return { success: true, message: 'User already exists in Firestore', status: 'existing' };
    }
    
    // Create user data 
    const userData = {
      uid: userRecord.uid,
      email: userRecord.email || email,
      displayName: userRecord.displayName || null,
      firstName: firstName || (userRecord.displayName ? userRecord.displayName.split(' ')[0] : null),
      lastName: lastName || (userRecord.displayName ? userRecord.displayName.split(' ').slice(1).join(' ') : null),
      username: (userRecord.email ? userRecord.email.split('@')[0] : null),
      mobile: userRecord.phoneNumber || null,
      photoURL: userRecord.photoURL || null,
      phoneNumber: userRecord.phoneNumber || null,
      isAdmin: false, // New users are not admins by default
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      emailVerified: userRecord.emailVerified || false
    };
    
    // Add user to Firestore
    await userDocRef.set(userData);
    
    console.log(`User ${uid} successfully added to Firestore`);
    
    return { 
      success: true, 
      message: 'User successfully added to Firestore',
      status: 'created'
    };
  } catch (error: any) {
    console.error("Error manually creating user in Firestore:", error);
    return {
      success: false,
      message: 'Failed to create user in Firestore',
      error: error.message || 'Unknown error'
    };
  }
}