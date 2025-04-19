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
    
    // Call our API endpoint
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
      console.log('User Firestore creation result:', result);
      return true;
    } else {
      console.error('Failed to create user in Firestore:', await response.json());
      return false;
    }
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