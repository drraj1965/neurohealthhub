/**
 * Admin preload mechanism
 * 
 * This module provides a way to preload super admin credentials
 * into the browser's session storage so they're available
 * immediately on page load, even before Firebase Auth initializes.
 */

import { FirebaseUser } from '@shared/schema';

// Super admin emails for reference
const SUPER_ADMIN_EMAILS = [
  "drphaniraj1965@gmail.com",
  "doctornerves@gmail.com",
  "g.rajshaker@gmail.com"
];

const SESSION_ADMIN_KEY = 'neurohealthhub_session_admin';

/**
 * Check if the current user is a super admin by email
 */
export function isSuperAdminEmail(email: string): boolean {
  return SUPER_ADMIN_EMAILS.includes(email);
}

/**
 * Save admin to session storage for immediate access
 */
export function saveAdminToSession(admin: FirebaseUser): void {
  try {
    if (admin && admin.email && isSuperAdminEmail(admin.email)) {
      // Make sure it has the admin flag set
      const adminWithFlag = {
        ...admin,
        isAdmin: true,
        emailVerified: true
      };
      
      // Store in session storage (cleared when browser closes)
      sessionStorage.setItem(SESSION_ADMIN_KEY, JSON.stringify(adminWithFlag));
      console.log('Super admin saved to session storage for immediate access');
    }
  } catch (error) {
    console.error('Error saving admin to session storage:', error);
  }
}

/**
 * Get admin from session storage if available
 */
export function getAdminFromSession(): FirebaseUser | null {
  try {
    const adminJson = sessionStorage.getItem(SESSION_ADMIN_KEY);
    if (!adminJson) return null;
    
    const admin = JSON.parse(adminJson) as FirebaseUser;
    
    // Validate it's a real admin
    if (admin && admin.email && isSuperAdminEmail(admin.email)) {
      console.log('Found valid super admin in session storage:', admin.email);
      return admin;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting admin from session storage:', error);
    return null;
  }
}

/**
 * Pre-authenticate a super admin user based on session data
 * This can be used to bypass Firebase auth state delays
 */
export function preAuthenticateAdmin(): FirebaseUser | null {
  // Try to get admin from session storage
  const sessionAdmin = getAdminFromSession();
  if (sessionAdmin) {
    console.log('Pre-authenticating admin from session:', sessionAdmin.email);
    return sessionAdmin;
  }
  
  // Fallback to localStorage if no session admin found
  try {
    // Try to find a super admin in localStorage
    const localUsersJson = localStorage.getItem('neurohealthhub_local_users');
    if (!localUsersJson) return null;
    
    const localUsers = JSON.parse(localUsersJson);
    
    // Check each user to see if they're a super admin
    for (const uid in localUsers) {
      const user = localUsers[uid];
      if (user && user.email && isSuperAdminEmail(user.email)) {
        console.log('Found super admin in local storage:', user.email);
        
        // If found, also save to session for future quick access
        saveAdminToSession(user);
        
        return user;
      }
    }
    
    // Try specialized super admin store
    const superAdminsJson = localStorage.getItem('neurohealthhub_local_super_admins');
    if (!superAdminsJson) return null;
    
    const superAdmins = JSON.parse(superAdminsJson);
    
    // Get the first super admin (if any)
    for (const uid in superAdmins) {
      const admin = superAdmins[uid];
      if (admin) {
        console.log('Found super admin in specialized store:', admin.email);
        
        // Save to session for future quick access
        saveAdminToSession(admin);
        
        return admin;
      }
    }
  } catch (error) {
    console.error('Error during pre-authentication from local storage:', error);
  }
  
  return null;
}