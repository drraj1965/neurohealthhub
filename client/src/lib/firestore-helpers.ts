/**
 * Helper functions for Firestore operations
 * These functions help ensure users are properly created in Firestore after verification
 */

/**
 * This function tries to create a user in Firestore via the server API
 * It's a safety measure to ensure verified users are properly added to the database
 */
export async function ensureUserInFirestore(
  uid: string,
  email: string,
  firstName?: string,
  lastName?: string
): Promise<boolean> {
  try {
    console.log(`Ensuring user ${uid} is created in Firestore...`);
    
    // Try both server API and direct approaches
    let serverSuccess = false;
    
    // First try server API
    try {
      console.log('Trying server API first...');
      const response = await fetch('/api/firebase-auth/manual-create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          email,
          firstName,
          lastName
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('User Firestore creation via server API result:', result);
        serverSuccess = true;
      } else {
        console.error('Server API failed to create user in Firestore:', await response.text());
      }
    } catch (serverError) {
      console.error('Error calling server API:', serverError);
    }
    
    // If server approach failed, try direct approach
    if (!serverSuccess) {
      console.log('Server API approach failed, trying direct connection...');
      
      try {
        // Dynamically import to avoid circular dependencies
        const { directCreateUserInFirestore } = await import('./firebase-direct');
        
        // Call direct method
        const directSuccess = await directCreateUserInFirestore({
          uid,
          email,
          firstName,
          lastName,
          emailVerified: true
        });
        
        if (directSuccess) {
          console.log('Successfully created user in Firestore via direct connection');
          return true;
        } else {
          console.error('Failed to create user via direct connection too');
        }
      } catch (directError) {
        console.error('Error with direct connection approach:', directError);
      }
      
      // Try basic "last resort" approach
      try {
        console.log('Trying last resort basic connection...');
        const { getFirestore, doc, setDoc } = await import('firebase/firestore');
        const db = getFirestore();
        
        await setDoc(doc(db, 'users', uid), {
          uid,
          email,
          firstName: firstName || 'User',
          lastName: lastName || '',
          isAdmin: false,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }, { merge: true });
        
        console.log('User created with last resort approach');
        return true;
      } catch (lastResortError) {
        console.error('All approaches failed to create user in Firestore:', lastResortError);
        return false;
      }
    }
    
    return serverSuccess;
  } catch (error) {
    console.error('Error ensuring user is in Firestore:', error);
    return false;
  }
}

/**
 * Handles logging in a user with fallback for Firestore issues
 * This is used in the login process to ensure users are properly redirected
 */
export function handleLoginRedirect(email: string, uid: string): void {
  // Check if user should go to super admin or admin dashboard
  const superAdminEmails = [
    "drphaniraj1965@gmail.com",
    "doctornerves@gmail.com",
    "g.rajshaker@gmail.com"
  ];
                       
  const isSuperAdmin = email && superAdminEmails.includes(email);
  const isDoctor = email.endsWith("@doctor.com");
  
  // Make sure the user exists in Firestore before redirecting
  ensureUserInFirestore(uid, email).then(() => {
    // Wait a short time to ensure the auth state is fully processed
    setTimeout(() => {
      try {
        if (isSuperAdmin) {
          console.log("Super admin user detected, redirecting to super admin");
          window.location.href = "/super-admin";
        } else if (isDoctor) {
          console.log("Doctor user detected, redirecting to admin dashboard");
          window.location.href = "/admin";
        } else {
          console.log("Regular user detected, redirecting to user dashboard");
          window.location.href = "/dashboard";
        }
      } catch (error) {
        console.error('Error during redirect:', error);
        // Force navigation as fallback
        window.location.href = isSuperAdmin ? "/super-admin" : 
                              isDoctor ? "/admin" : "/dashboard";
      }
    }, 500);
  }).catch(error => {
    console.error('Error ensuring user exists in Firestore:', error);
    // Redirect anyway as fallback
    window.location.href = isSuperAdmin ? "/super-admin" : 
                          isDoctor ? "/admin" : "/dashboard";
  });
}