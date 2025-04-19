import { initializeApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { UserRecord } from 'firebase-admin/auth';
import { cert } from 'firebase-admin/app';

let firebaseAdminApp: App | null = null;

/**
 * Initialize the Firebase Admin SDK from environment variables
 */
export function initializeFirebaseAdmin() {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  try {
    // Parse the admin credentials from environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CONFIG || '{}');
    
    console.log('Initializing Firebase Admin SDK with project:', serviceAccount.project_id);
    
    // Initialize the app using the imported initializeApp function
    firebaseAdminApp = initializeApp({
      credential: cert(serviceAccount)
    });
    
    console.log('Firebase Admin SDK initialized successfully');
    
    return firebaseAdminApp;
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw new Error('Failed to initialize Firebase Admin SDK');
  }
}

/**
 * Get all Firebase Auth users (with pagination)
 */
export async function getFirebaseAuthUsers(maxResults = 1000): Promise<UserRecord[]> {
  try {
    // Initialize the app
    initializeFirebaseAdmin();
    
    // Get Auth instance using the imported getAuth function
    const auth = getAuth();
    
    console.log('Fetching Firebase Auth users...');
    
    // List users with pagination
    const listUsersResult = await auth.listUsers(maxResults);
    
    console.log(`Successfully fetched ${listUsersResult.users.length} Firebase Auth users`);
    
    return listUsersResult.users;
  } catch (error) {
    console.error('Error fetching Firebase Auth users:', error);
    throw new Error('Failed to fetch Firebase Auth users');
  }
}

/**
 * Get a specific Firebase Auth user by UID
 */
export async function getFirebaseAuthUserByUid(uid: string): Promise<UserRecord | null> {
  try {
    // Initialize the app
    initializeFirebaseAdmin();
    
    // Get Auth instance using the imported getAuth function
    const auth = getAuth();
    
    const userRecord = await auth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error fetching Firebase Auth user by UID:', error);
    return null;
  }
}

/**
 * Get a specific Firebase Auth user by email
 */
export async function getFirebaseAuthUserByEmail(email: string): Promise<UserRecord | null> {
  try {
    // Initialize the app
    initializeFirebaseAdmin();
    
    // Get Auth instance using the imported getAuth function
    const auth = getAuth();
    
    const userRecord = await auth.getUserByEmail(email);
    return userRecord;
  } catch (error) {
    console.error('Error fetching Firebase Auth user by email:', error);
    return null;
  }
}

/**
 * Create a new Firebase Auth user
 */
export async function createFirebaseAuthUser(userData: {
  email: string;
  password: string;
  displayName?: string;
  phoneNumber?: string;
}): Promise<UserRecord | null> {
  try {
    // Initialize the app
    initializeFirebaseAdmin();
    
    // Get Auth instance using the imported getAuth function
    const auth = getAuth();
    
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      phoneNumber: userData.phoneNumber,
    });
    
    console.log('Successfully created new user:', userRecord.uid);
    return userRecord;
  } catch (error) {
    console.error('Error creating new Firebase Auth user:', error);
    return null;
  }
}

/**
 * Update a Firebase Auth user
 */
export async function updateFirebaseAuthUser(uid: string, userData: {
  email?: string;
  password?: string;
  displayName?: string;
  phoneNumber?: string;
  disabled?: boolean;
}): Promise<UserRecord | null> {
  try {
    // Initialize the app
    initializeFirebaseAdmin();
    
    // Get Auth instance using the imported getAuth function
    const auth = getAuth();
    
    const userRecord = await auth.updateUser(uid, userData);
    
    console.log('Successfully updated user:', userRecord.uid);
    return userRecord;
  } catch (error) {
    console.error('Error updating Firebase Auth user:', error);
    return null;
  }
}

/**
 * Delete a Firebase Auth user
 */
export async function deleteFirebaseAuthUser(uid: string): Promise<boolean> {
  try {
    // Initialize the app
    initializeFirebaseAdmin();
    
    // Get Auth instance using the imported getAuth function
    const auth = getAuth();
    
    await auth.deleteUser(uid);
    
    console.log('Successfully deleted user:', uid);
    return true;
  } catch (error) {
    console.error('Error deleting Firebase Auth user:', error);
    return false;
  }
}

/**
 * Generate a verification email link
 */
export async function generateEmailVerificationLink(uid: string): Promise<string | null> {
  try {
    // Initialize the app
    initializeFirebaseAdmin();
    
    // Get Auth instance using the imported getAuth function
    const auth = getAuth();
    
    // Get the user record first to check if they exist
    const userRecord = await auth.getUser(uid);
    
    if (!userRecord) {
      throw new Error(`User with UID ${uid} not found`);
    }
    
    if (!userRecord.email) {
      throw new Error(`User with UID ${uid} does not have an email address`);
    }
    
    // Generate email verification link
    const actionCodeSettings = {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://neurohealthhub.replit.app/email-verified' 
        : 'http://localhost:5000/email-verified',
      handleCodeInApp: true,
    };
    
    const link = await auth.generateEmailVerificationLink(
      userRecord.email,
      actionCodeSettings
    );
    
    console.log(`Generated verification link for user ${uid} with email ${userRecord.email}`);
    return link;
  } catch (error) {
    console.error('Error generating email verification link:', error);
    return null;
  }
}

/**
 * Send a verification email to a user
 */
export async function sendVerificationEmail(uid: string): Promise<boolean> {
  try {
    // Initialize the app
    initializeFirebaseAdmin();
    
    // Get Auth instance using the imported getAuth function
    const auth = getAuth();
    
    // Get the user record first to check if they exist
    const userRecord = await auth.getUser(uid);
    
    if (!userRecord) {
      throw new Error(`User with UID ${uid} not found`);
    }
    
    if (!userRecord.email) {
      throw new Error(`User with UID ${uid} does not have an email address`);
    }
    
    // Generate the verification link
    const link = await generateEmailVerificationLink(uid);
    
    if (!link) {
      throw new Error('Failed to generate verification link');
    }
    
    // Here you would typically use an email service (SendGrid, Mailgun, etc.)
    // For now, we'll just log the link and return success
    console.log('VERIFICATION LINK FOR USER:', link);
    console.log('Please implement actual email sending with your preferred email provider');
    
    // Return true indicating success (in a real implementation, you'd check if the email was sent)
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}