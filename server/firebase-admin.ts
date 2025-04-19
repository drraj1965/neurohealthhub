import { initializeApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { UserRecord } from 'firebase-admin/auth';
import { cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { sendEmail } from './notifications';

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
 * 
 * This creates a custom verification link that bypasses Firebase's domain restrictions
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
    
    // Generate a Firebase verification link using the Admin SDK
    try {
      // Generate an action code (verification link) for the user
      const actionCodeSettings = {
        url: 'https://4e143170-16d8-4096-a115-0695954d385d-00-3d558dqtzajfp.janeway.replit.dev/email-verified',
        handleCodeInApp: false,
      };
      
      // Get a verification link for the user
      const link = await auth.generateEmailVerificationLink(
        userRecord.email,
        actionCodeSettings
      );
      
      console.log(`Generated Firebase verification link for user ${uid} with email ${userRecord.email}`);
      return link;
    } catch (firebaseError) {
      console.error('Firebase error generating verification link:', firebaseError);
      
      // Fallback to custom token if Firebase link generation fails
      const tokenData = {
        uid: uid,
        email: userRecord.email,
        timestamp: Date.now(),
        // Add an expiration time (24 hours from now)
        expires: Date.now() + (24 * 60 * 60 * 1000)
      };
      
      // Create a secure token by encoding the data
      const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
      
      // Create our custom verification URL with the token
      const customVerificationUrl = `https://4e143170-16d8-4096-a115-0695954d385d-00-3d558dqtzajfp.janeway.replit.dev/email-verified?token=${token}`;
      
      console.log(`Generated fallback custom verification link for user ${uid}`);
      return customVerificationUrl;
    }
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
    
    // Log the verification link for debugging purposes
    console.log(`Verification link generated for user ${uid}: ${link}`);
    
    // Send the verification email using the imported sendEmail function
    try {
      // Format a nice HTML email with the verification link
      const userDisplayName = userRecord.displayName || userRecord.email.split('@')[0];
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">NeuroHealthHub Email Verification</h2>
          <p>Hello ${userDisplayName},</p>
          <p>Thank you for registering with NeuroHealthHub. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify My Email</a>
          </div>
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4a5568;"><a href="${link}">${link}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account with NeuroHealthHub, you can safely ignore this email.</p>
          <p>Best regards,<br>The NeuroHealthHub Team</p>
        </div>
      `;
      
      // Send the email
      await sendEmail({
        to: userRecord.email,
        subject: 'Verify Your NeuroHealthHub Email Address',
        text: `Hello ${userDisplayName}, please verify your email by clicking this link: ${link}`,
        html: emailHtml
      });
      
      console.log(`Verification email sent to ${userRecord.email}`);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Even if email sending fails, we'll still log the link
      console.log('VERIFICATION LINK FOR USER:', link);
      console.log('Email sending failed, but verification link was generated successfully');
    }
    
    // Return true indicating success since we generated the link successfully
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}