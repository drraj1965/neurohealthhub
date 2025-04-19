/**
 * Local user storage module
 * 
 * This module provides functionality for storing and retrieving user data
 * in the browser's local storage as a fallback when Firestore is unreachable.
 */

import { FirebaseUser } from '@shared/schema';

// Key for storing users in localStorage
const LOCAL_USERS_KEY = 'neurohealthhub_local_users';

// Specialized key for super admins
const LOCAL_SUPER_ADMINS_KEY = 'neurohealthhub_local_super_admins';

// Super admin emails for reference
const SUPER_ADMIN_EMAILS = [
  "drphaniraj1965@gmail.com",
  "doctornerves@gmail.com",
  "g.rajshaker@gmail.com"
];

// Check if an email is a super admin email
function isSuperAdminEmail(email: string): boolean {
  return SUPER_ADMIN_EMAILS.includes(email);
}

/**
 * Save a user to local storage for offline access
 * @param user The user to save
 */
export function saveUserLocally(user: FirebaseUser): void {
  if (!user || !user.uid) {
    console.error('Cannot save invalid user to local storage');
    return;
  }
  
  try {
    // General users store
    const existingUsersJson = localStorage.getItem(LOCAL_USERS_KEY);
    let users: Record<string, FirebaseUser> = {};
    
    if (existingUsersJson) {
      users = JSON.parse(existingUsersJson);
    }
    
    // Add update timestamp
    const userWithTimestamp: FirebaseUser = {
      ...user,
      updatedAt: new Date().toISOString()
    };
    
    // Save to general users store
    users[user.uid] = userWithTimestamp;
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    
    // If super admin, also save to specialized super admin store
    if (user.email && isSuperAdminEmail(user.email)) {
      const existingSuperAdminsJson = localStorage.getItem(LOCAL_SUPER_ADMINS_KEY);
      let superAdmins: Record<string, FirebaseUser> = {};
      
      if (existingSuperAdminsJson) {
        superAdmins = JSON.parse(existingSuperAdminsJson);
      }
      
      // Make sure isAdmin flag is set
      const adminWithFlag: FirebaseUser = {
        ...userWithTimestamp,
        isAdmin: true
      };
      
      superAdmins[user.uid] = adminWithFlag;
      localStorage.setItem(LOCAL_SUPER_ADMINS_KEY, JSON.stringify(superAdmins));
      console.log('Super admin saved to specialized storage:', user.email);
    }
    
    console.log('User saved to local storage:', user.uid);
  } catch (error) {
    console.error('Error saving user to local storage:', error);
  }
}

/**
 * Get a user from local storage by UID
 * @param uid The user ID to look up
 * @returns The user object if found, null otherwise
 */
export function getUserFromLocalStorage(uid: string): FirebaseUser | null {
  if (!uid) return null;
  
  try {
    // First check specialized super admin store
    const superAdminsJson = localStorage.getItem(LOCAL_SUPER_ADMINS_KEY);
    if (superAdminsJson) {
      const superAdmins = JSON.parse(superAdminsJson);
      if (superAdmins[uid]) {
        console.log('Found user in super admin specialized store:', uid);
        return superAdmins[uid];
      }
    }
    
    // Then check general users store
    const usersJson = localStorage.getItem(LOCAL_USERS_KEY);
    if (!usersJson) return null;
    
    const users = JSON.parse(usersJson);
    if (!users[uid]) return null;
    
    console.log('Found user in local storage:', uid);
    return users[uid];
  } catch (error) {
    console.error('Error getting user from local storage:', error);
    return null;
  }
}

/**
 * Get a user from local storage by email
 * @param email The email to look up
 * @returns The user object if found, null otherwise
 */
export function getUserByEmailFromLocalStorage(email: string): FirebaseUser | null {
  if (!email) return null;
  
  try {
    // First check specialized super admin store if it's a super admin email
    if (isSuperAdminEmail(email)) {
      const superAdminsJson = localStorage.getItem(LOCAL_SUPER_ADMINS_KEY);
      if (superAdminsJson) {
        const superAdmins = JSON.parse(superAdminsJson);
        // Find the first super admin with this email
        for (const uid in superAdmins) {
          if (superAdmins[uid].email === email) {
            console.log('Found super admin by email in specialized store:', email);
            return superAdmins[uid];
          }
        }
      }
    }
    
    // Then check general users store
    const usersJson = localStorage.getItem(LOCAL_USERS_KEY);
    if (!usersJson) return null;
    
    const users = JSON.parse(usersJson);
    
    // Find user by email
    for (const uid in users) {
      if (users[uid].email === email) {
        console.log('Found user by email in local storage:', email);
        return users[uid];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user by email from local storage:', error);
    return null;
  }
}

/**
 * Get all users from local storage
 * @returns Array of user objects
 */
export function getAllUsersFromLocalStorage(): FirebaseUser[] {
  try {
    const usersJson = localStorage.getItem(LOCAL_USERS_KEY);
    if (!usersJson) return [];
    
    const users = JSON.parse(usersJson);
    return Object.values(users);
  } catch (error) {
    console.error('Error getting all users from local storage:', error);
    return [];
  }
}

/**
 * Remove a user from local storage
 * @param uid The user ID to remove
 */
export function removeUserFromLocalStorage(uid: string): void {
  if (!uid) return;
  
  try {
    // Remove from general users store
    const usersJson = localStorage.getItem(LOCAL_USERS_KEY);
    if (usersJson) {
      const users = JSON.parse(usersJson);
      if (users[uid]) {
        delete users[uid];
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
        console.log('User removed from local storage:', uid);
      }
    }
    
    // Remove from specialized super admin store
    const superAdminsJson = localStorage.getItem(LOCAL_SUPER_ADMINS_KEY);
    if (superAdminsJson) {
      const superAdmins = JSON.parse(superAdminsJson);
      if (superAdmins[uid]) {
        delete superAdmins[uid];
        localStorage.setItem(LOCAL_SUPER_ADMINS_KEY, JSON.stringify(superAdmins));
        console.log('User removed from super admin specialized store:', uid);
      }
    }
  } catch (error) {
    console.error('Error removing user from local storage:', error);
  }
}

/**
 * Clear all users from local storage
 */
export function clearLocalUserStorage(): void {
  try {
    localStorage.removeItem(LOCAL_USERS_KEY);
    localStorage.removeItem(LOCAL_SUPER_ADMINS_KEY);
    console.log('Local user storage cleared');
  } catch (error) {
    console.error('Error clearing local user storage:', error);
  }
}

/**
 * Check if we have a super admin in local storage
 */
export function hasSuperAdminInLocalStorage(): boolean {
  try {
    // Check specialized super admin store first
    const superAdminsJson = localStorage.getItem(LOCAL_SUPER_ADMINS_KEY);
    if (superAdminsJson) {
      const superAdmins = JSON.parse(superAdminsJson);
      if (Object.keys(superAdmins).length > 0) {
        return true;
      }
    }
    
    // Then check general users store
    const usersJson = localStorage.getItem(LOCAL_USERS_KEY);
    if (!usersJson) return false;
    
    const users = JSON.parse(usersJson);
    
    // Check for users with super admin email
    for (const uid in users) {
      if (users[uid].email && isSuperAdminEmail(users[uid].email)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking for super admin in local storage:', error);
    return false;
  }
}