/**
 * Local user storage to handle Firestore connectivity issues
 * This provides a fallback when Firestore connections are failing
 */

import { FirebaseUser } from '@shared/schema';

const LOCAL_USERS_KEY = 'neurohealthhub_local_users';
const LOCAL_SUPER_ADMINS_KEY = 'neurohealthhub_local_super_admins';

// Hard-coded super admin emails for reference
const SUPER_ADMIN_EMAILS = [
  "drphaniraj1965@gmail.com",
  "doctornerves@gmail.com",
  "g.rajshaker@gmail.com"
];

/**
 * Save a user to local storage
 */
export function saveUserLocally(user: FirebaseUser): void {
  try {
    // Get existing users map
    const existingUsersJson = localStorage.getItem(LOCAL_USERS_KEY) || '{}';
    const users = JSON.parse(existingUsersJson);
    
    // Save this user by uid
    users[user.uid] = {
      ...user,
      updatedAt: new Date().toISOString()
    };
    
    // Save back to localStorage
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    console.log('User saved to local storage:', user.uid);
    
    // If this is a super admin, also save to a specialized store
    if (user.email && SUPER_ADMIN_EMAILS.includes(user.email)) {
      const superAdminsJson = localStorage.getItem(LOCAL_SUPER_ADMINS_KEY) || '{}';
      const superAdmins = JSON.parse(superAdminsJson);
      
      superAdmins[user.uid] = {
        ...user,
        isAdmin: true,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem(LOCAL_SUPER_ADMINS_KEY, JSON.stringify(superAdmins));
      console.log('Super admin saved to specialized local storage:', user.uid);
    }
  } catch (error) {
    console.error('Error saving user to local storage:', error);
  }
}

/**
 * Get a user from local storage by UID
 */
export function getUserByUidLocally(uid: string): FirebaseUser | null {
  try {
    // First check super admins
    const superAdminsJson = localStorage.getItem(LOCAL_SUPER_ADMINS_KEY);
    if (superAdminsJson) {
      const superAdmins = JSON.parse(superAdminsJson);
      if (superAdmins[uid]) {
        console.log('Found user in super admin local storage:', uid);
        return superAdmins[uid] as FirebaseUser;
      }
    }
    
    // Then check regular users
    const usersJson = localStorage.getItem(LOCAL_USERS_KEY);
    if (!usersJson) return null;
    
    const users = JSON.parse(usersJson);
    if (users[uid]) {
      console.log('Found user in local storage:', uid);
      return users[uid] as FirebaseUser;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user from local storage:', error);
    return null;
  }
}

/**
 * Get a user from local storage by email
 */
export function getUserByEmailLocally(email: string): FirebaseUser | null {
  try {
    // First check super admins
    const superAdminsJson = localStorage.getItem(LOCAL_SUPER_ADMINS_KEY);
    if (superAdminsJson) {
      const superAdmins = JSON.parse(superAdminsJson);
      for (const uid in superAdmins) {
        if (superAdmins[uid].email === email) {
          console.log('Found user in super admin local storage by email:', email);
          return superAdmins[uid] as FirebaseUser;
        }
      }
    }
    
    // Then check regular users
    const usersJson = localStorage.getItem(LOCAL_USERS_KEY);
    if (!usersJson) return null;
    
    const users = JSON.parse(usersJson);
    for (const uid in users) {
      if (users[uid].email === email) {
        console.log('Found user in local storage by email:', email);
        return users[uid] as FirebaseUser;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user from local storage by email:', error);
    return null;
  }
}

/**
 * Check if user is super admin by email
 */
export function isSuperAdminEmail(email: string): boolean {
  return SUPER_ADMIN_EMAILS.includes(email);
}

/**
 * Get all users from local storage
 */
export function getAllUsersLocally(): FirebaseUser[] {
  try {
    const usersJson = localStorage.getItem(LOCAL_USERS_KEY);
    if (!usersJson) return [];
    
    const users = JSON.parse(usersJson);
    return Object.values(users) as FirebaseUser[];
  } catch (error) {
    console.error('Error getting all users from local storage:', error);
    return [];
  }
}

/**
 * Add a user to local storage (for admin operations)
 */
export function addUserLocally(user: FirebaseUser): boolean {
  try {
    // Get existing users
    const existingUsersJson = localStorage.getItem(LOCAL_USERS_KEY) || '{}';
    const users = JSON.parse(existingUsersJson);
    
    // Add this user
    users[user.uid] = {
      ...user,
      updatedAt: new Date().toISOString()
    };
    
    // Save back to localStorage
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    console.log('User added to local storage:', user.uid);
    return true;
  } catch (error) {
    console.error('Error adding user to local storage:', error);
    return false;
  }
}

/**
 * Update a user in local storage
 */
export function updateUserLocally(uid: string, userData: Partial<FirebaseUser>): boolean {
  try {
    // Get existing users
    const existingUsersJson = localStorage.getItem(LOCAL_USERS_KEY) || '{}';
    const users = JSON.parse(existingUsersJson);
    
    // If user exists, update
    if (users[uid]) {
      users[uid] = {
        ...users[uid],
        ...userData,
        updatedAt: new Date().toISOString()
      };
      
      // Save back to localStorage
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
      console.log('User updated in local storage:', uid);
      
      // If this is a super admin, also update in specialized store
      if (users[uid].email && SUPER_ADMIN_EMAILS.includes(users[uid].email)) {
        const superAdminsJson = localStorage.getItem(LOCAL_SUPER_ADMINS_KEY) || '{}';
        const superAdmins = JSON.parse(superAdminsJson);
        
        superAdmins[uid] = {
          ...superAdmins[uid],
          ...userData,
          isAdmin: true,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem(LOCAL_SUPER_ADMINS_KEY, JSON.stringify(superAdmins));
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating user in local storage:', error);
    return false;
  }
}

/**
 * Remove a user from local storage
 */
export function removeUserLocally(uid: string): boolean {
  try {
    // Get existing users
    const existingUsersJson = localStorage.getItem(LOCAL_USERS_KEY) || '{}';
    const users = JSON.parse(existingUsersJson);
    
    // If user exists, remove
    if (users[uid]) {
      delete users[uid];
      
      // Save back to localStorage
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
      console.log('User removed from local storage:', uid);
      
      // Also check super admins
      const superAdminsJson = localStorage.getItem(LOCAL_SUPER_ADMINS_KEY) || '{}';
      const superAdmins = JSON.parse(superAdminsJson);
      
      if (superAdmins[uid]) {
        delete superAdmins[uid];
        localStorage.setItem(LOCAL_SUPER_ADMINS_KEY, JSON.stringify(superAdmins));
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error removing user from local storage:', error);
    return false;
  }
}