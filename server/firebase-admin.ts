import { initializeApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { cert } from 'firebase-admin/app';
import * as dotenv from 'dotenv';
import { sendEmail } from './notifications';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env file
dotenv.config();

// Ensure proper path resolution for Windows OS
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename); // Resolve directory of current file

let firebaseAdminApp: App | null = null;

/**
 * Initialize the Firebase Admin SDK from environment variables
 */
export async function initializeFirebaseAdmin() {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  try {
    // Debugging the directory and path
    console.log('Resolved __dirname:', __dirname); // Debugging __dirname
    
    // Fix the service account file path resolution
    const serviceAccountPath = path.normalize(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '');
    console.log('Resolved serviceAccountPath:', serviceAccountPath); // Debugging the path to the service account file
    
    // Ensure the service account file exists at the resolved path
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Service account file not found at path: ${serviceAccountPath}`);
    }

    // Convert the file path to a file URL
    const serviceAccountUrl = new URL(`file://${serviceAccountPath.replace(/\\/g, '/')}`);
    
    // Dynamically import the service account file
    const serviceAccount = await import(serviceAccountUrl.href);
    console.log('Service Account Data:', serviceAccount); // Debugging the imported service account

    console.log('Initializing Firebase Admin SDK with project:', serviceAccount.project_id);

    // Initialize Firebase Admin SDK using the service account credentials
    firebaseAdminApp = initializeApp({
      credential: cert(serviceAccount),
    });

    console.log('Firebase Admin SDK initialized successfully');
    
    return firebaseAdminApp;
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw new Error('Failed to initialize Firebase Admin SDK');
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
}): Promise<any> {
  try {
    initializeFirebaseAdmin();  // Ensure Firebase is initialized
    const auth = getAuth();
    
    const userRecord = await auth.updateUser(uid, userData);  // Update user by UID
    console.log('Successfully updated user:', userRecord.uid);
    return userRecord;
  } catch (error) {
    console.error('Error updating Firebase Auth user:', error);
    return null;
  }
}

/**
 * Get Firebase Auth user by UID
 */
export async function getFirebaseAuthUserByUid(uid: string): Promise<any> {
  try {
    initializeFirebaseAdmin();  // Ensure Firebase is initialized
    const auth = getAuth();
    const userRecord = await auth.getUser(uid);  // Fetch user by UID
    return userRecord;
  } catch (error) {
    console.error('Error fetching Firebase Auth user by UID:', error);
    return null;
  }
}

/**
 * Get Firebase Auth user by email
 */
export async function getFirebaseAuthUserByEmail(email: string): Promise<any> {
  try {
    initializeFirebaseAdmin();  // Ensure Firebase is initialized

    const auth = getAuth();
    
    const userRecord = await auth.getUserByEmail(email);
    return userRecord;
  } catch (error) {
    console.error('Error fetching Firebase Auth user by email:', error);
    return null;
  }
}

/**
 * Get all Firebase Auth users (with pagination)
 */
export async function getFirebaseAuthUsers(maxResults = 1000): Promise<any[]> {
  try {
    initializeFirebaseAdmin();  // Ensure Firebase is initialized
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
 * Create a new Firebase Auth user
 */
export async function createFirebaseAuthUser(userData: {
  email: string;
  password: string;
  displayName?: string;
  phoneNumber?: string;
}): Promise<any> {
  try {
    initializeFirebaseAdmin();  // Ensure Firebase is initialized
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
 * Delete a Firebase Auth user
 */
export async function deleteFirebaseAuthUser(uid: string): Promise<boolean> {
  try {
    initializeFirebaseAdmin();  // Ensure Firebase is initialized
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
 * Send a verification email to a user
 */
export async function sendVerificationEmail(uid: string): Promise<boolean> {
  try {
    initializeFirebaseAdmin();  // Ensure Firebase is initialized
    const auth = getAuth();
    
    const userRecord = await auth.getUser(uid);
    
    if (!userRecord) {
      throw new Error(`User with UID ${uid} not found`);
    }
    
    if (!userRecord.email) {
      throw new Error(`User with UID ${uid} does not have an email address`);
    }
    
    const link = await generateEmailVerificationLink(uid);
    
    if (!link) {
      throw new Error('Failed to generate verification link');
    }

    console.log(`Verification link generated for user ${uid}: ${link}`);
    
    try {
      const emailHtml = `...`; // Your email HTML template here
      await sendEmail({
        to: userRecord.email,
        subject: 'Verify Your NeuroHealthHub Email Address',
        text: `Hello ${userRecord.displayName || userRecord.email.split('@')[0]}, please verify your email by clicking this link: ${link}`,
        html: emailHtml
      });

      console.log(`Verification email sent to ${userRecord.email}`);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      console.log('VERIFICATION LINK FOR USER:', link);
      console.log('Email sending failed, but verification link was generated successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

/**
 * Generate an email verification link
 */
export async function generateEmailVerificationLink(uid: string): Promise<string | null> {
  try {
    initializeFirebaseAdmin();  // Ensure Firebase is initialized
    const auth = getAuth();
    
    const userRecord = await auth.getUser(uid);
    
    if (!userRecord) {
      throw new Error(`User with UID ${uid} not found`);
    }
    
    if (!userRecord.email) {
      throw new Error(`User with UID ${uid} does not have an email address`);
    }
    
    const actionCodeSettings = {
      url: 'https://your-redirect-url.com/email-verified', // Replace with your actual redirect URL
      handleCodeInApp: false,
    };

    const link = await auth.generateEmailVerificationLink(userRecord.email, actionCodeSettings);
    
    console.log(`Generated Firebase verification link for user ${uid} with email ${userRecord.email}`);
    return link;
  } catch (error) {
    console.error('Error generating email verification link:', error);
    return null;
  }
}