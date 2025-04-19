import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { FirebaseUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Import Firebase components from our lib file
import { auth, db } from "@/lib/firebase";

// Define AuthContext type
interface AuthContextType {
  user: FirebaseUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

// Create context with a default value to avoid undefined checks
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

// Sample user data (for development fallback only)
const mockDoctorUser: FirebaseUser = {
  uid: "doctor123",
  email: "doctornerves@gmail.com",
  firstName: "Dr.",
  lastName: "Rajshekher",
  mobile: "+971501802970",
  isAdmin: true,
  username: "doctornerves",
};

const mockRegularUser: FirebaseUser = {
  uid: "user123",
  email: "user@example.com",
  firstName: "Rajshekher",
  lastName: "Garikapati",
  mobile: "+971501802970",
  isAdmin: false,
  username: "rajugent",
};

// AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    console.log("AuthProvider initialized");
    
    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? "User logged in" : "No user");
      
      // We need to preserve super admin status in two cases:
      // 1. If we already have a super admin in our state with matching UID
      // 2. If the current user email is in our super admin list
      const superAdminEmails = [
        "drphaniraj1965@gmail.com",
        "doctornerves@gmail.com",
        "g.rajshaker@gmail.com"
      ];
      
      // Check if current Firebase user is a super admin
      const isSuperAdminByEmail = firebaseUser?.email ? superAdminEmails.includes(firebaseUser.email) : false;
    
      if ((user && isAdmin && firebaseUser && user.uid === firebaseUser.uid) || isSuperAdminByEmail) {
        // If existing user is super admin, don't override their status
        // OR if current firebaseUser is a super admin by email
        if (isSuperAdminByEmail) {
          console.log("★★★ Super admin detected via email in auth state change, ALWAYS preserving super admin status");
          
          // Force set super admin user data in case it doesn't exist
          // Safely handle the potentially null firebaseUser (though we've already checked it above)
          const userProfile: FirebaseUser = {
            uid: firebaseUser!.uid,
            email: firebaseUser!.email || "",
            firstName: firebaseUser!.displayName?.split(' ')[0] || "Admin",
            lastName: firebaseUser!.displayName?.split(' ')[1] || "User",
            isAdmin: true,
            username: (firebaseUser!.email || "").split('@')[0] || "admin",
          };
          
          setUser(userProfile);
          setIsAdmin(true);
        } else {
          console.log("Auth state change detected, but preserving existing super admin status");
        }
        
        setIsLoading(false);
        return;
      }
      
      if (firebaseUser) {
        try {
          // Validate the current user has a valid token
          const idToken = await firebaseUser.getIdToken(true);
          console.log("User logged in with ID:", firebaseUser.uid);
          console.log("Auth token refreshed"); // We don't log the actual token for security
          
          // Check if user is a super admin by email
          const superAdminEmails = [
            "drphaniraj1965@gmail.com",
            "doctornerves@gmail.com",
            "g.rajshaker@gmail.com"
          ];
          
          // Log detailed info for debugging
          console.log("Auth email check:", {
            email: firebaseUser.email,
            isSuperAdmin: firebaseUser.email ? superAdminEmails.includes(firebaseUser.email) : false
          });
          
          if (firebaseUser.email && superAdminEmails.includes(firebaseUser.email)) {
            console.log("★ ★ ★ Super admin user detected in auth state change:", firebaseUser.email);
            // Force set admin privileges for super admins
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              firstName: firebaseUser.displayName?.split(' ')[0] || "Admin",
              lastName: firebaseUser.displayName?.split(' ')[1] || "User",
              isAdmin: true,
              username: firebaseUser.email.split('@')[0] || "admin",
            });
            setIsAdmin(true);
            setIsLoading(false);
            return; // Skip the regular user data lookup
          }
          
          // For non-super-admin users, try to find user data in various locations
          let userData = null;
          let userType = null;
          
          // Check if user has a verified email - we'll need this later
          const hasVerifiedEmail = firebaseUser.emailVerified;
          console.log(`User ${firebaseUser.uid} has verified email: ${hasVerifiedEmail}`);
          
          // Step 1: Try standard collections first with Firebase UID
          try {
            // Check users collection using Firebase UID
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              console.log("Regular user found in standard Firestore path with Firebase UID");
              userData = userDoc.data();
              userType = 'user';
            }
          } catch (error) {
            console.log("Error fetching from users collection with Firebase UID:", error);
          }
          
          // Step 1b: If not found with Firebase UID, try querying by email
          if (!userData && firebaseUser.email) {
            try {
              // Query for user by email instead of UID
              const usersRef = collection(db, 'users');
              const q = query(usersRef, where('email', '==', firebaseUser.email));
              const querySnapshot = await getDocs(q);
              
              if (!querySnapshot.empty) {
                console.log("User found by email in users collection, document ID:", querySnapshot.docs[0].id);
                const userDoc = querySnapshot.docs[0];
                userData = userDoc.data();
                userType = 'user';
                
                // Store the document ID for future reference
                console.log("Using user data from document with ID:", userDoc.id, "instead of Firebase UID");
              }
            } catch (error) {
              console.log("Error querying users by email:", error);
            }
          }
          
          // Step 2: Try doctors collection if user not found
          if (!userData) {
            try {
              const doctorDoc = await getDoc(doc(db, 'doctors', firebaseUser.uid));
              if (doctorDoc.exists()) {
                console.log("Doctor found in standard Firestore path with Firebase UID");
                userData = doctorDoc.data();
                userType = 'doctor';
              }
            } catch (error) {
              console.log("Error fetching from doctors collection with Firebase UID:", error);
            }
            
            // Step 2b: If not found with Firebase UID, try querying by email
            if (!userData && firebaseUser.email) {
              try {
                // Query for doctor by email instead of UID
                const doctorsRef = collection(db, 'doctors');
                const q = query(doctorsRef, where('email', '==', firebaseUser.email));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                  console.log("Doctor found by email in doctors collection, document ID:", querySnapshot.docs[0].id);
                  const doctorDoc = querySnapshot.docs[0];
                  userData = doctorDoc.data();
                  userType = 'doctor';
                  
                  // Store the document ID for future reference
                  console.log("Using doctor data from document with ID:", doctorDoc.id, "instead of Firebase UID");
                }
              } catch (error) {
                console.log("Error querying doctors by email:", error);
              }
            }
          }
          
          // Step 3: Try top-level neurohealthhub collection
          if (!userData) {
            try {
              const neuroDoc = await getDoc(doc(db, 'neurohealthhub', firebaseUser.uid));
              if (neuroDoc.exists()) {
                console.log("User found in neurohealthhub collection with Firebase UID");
                userData = neuroDoc.data();
                
                // Determine if it's a doctor or regular user
                if (userData.isAdmin === true || userData.specialization) {
                  userType = 'doctor';
                } else {
                  userType = 'user';
                }
              }
            } catch (error) {
              console.log("Error fetching from neurohealthhub collection with Firebase UID:", error);
            }
            
            // Step 3b: If not found with Firebase UID, try querying neurohealthhub by email
            if (!userData && firebaseUser.email) {
              try {
                // Query for user by email instead of UID in neurohealthhub collection
                const neuroRef = collection(db, 'neurohealthhub');
                const q = query(neuroRef, where('email', '==', firebaseUser.email));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                  console.log("User found by email in neurohealthhub collection, document ID:", querySnapshot.docs[0].id);
                  const neuroDoc = querySnapshot.docs[0];
                  userData = neuroDoc.data();
                  
                  // Determine if it's a doctor or regular user
                  if (userData.isAdmin === true || userData.specialization) {
                    userType = 'doctor';
                  } else {
                    userType = 'user';
                  }
                  
                  // Store the document ID for future reference
                  console.log("Using neurohealthhub data from document with ID:", neuroDoc.id, "instead of Firebase UID");
                }
              } catch (error) {
                console.log("Error querying neurohealthhub by email:", error);
              }
            }
          }
          
          // Set user data if found in any collection
          if (userData) {
            if (userType === 'doctor') {
              console.log("Setting doctor profile");
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || userData.email || "",
                firstName: userData.firstName || "",
                lastName: userData.lastName || "",
                mobile: userData.mobile || "",
                isAdmin: true,
                username: userData.username || "",
              });
              setIsAdmin(true);
            } else {
              console.log("Setting regular user profile");
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || userData.email || "",
                firstName: userData.firstName || "",
                lastName: userData.lastName || "",
                mobile: userData.mobile || "",
                isAdmin: userData.isAdmin || false,
                username: userData.username || "",
              });
              setIsAdmin(userData.isAdmin || false);
            }
          } else {
            console.log("No user profile found in Firestore, using Firebase data");
            // No data in database, use Firebase user data
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              firstName: firebaseUser.displayName?.split(' ')[0] || "User",
              lastName: firebaseUser.displayName?.split(' ')[1] || firebaseUser.uid.substring(0, 5),
              isAdmin: false,
              username: firebaseUser.email?.split('@')[0] || "user",
            });
            setIsAdmin(false);
            
            // Create user profile in Firestore
            if (firebaseUser.email) {
              try {
                // Try to create in standard users collection
                await setDoc(doc(db, "users", firebaseUser.uid), {
                  email: firebaseUser.email,
                  firstName: firebaseUser.displayName?.split(' ')[0] || "User",
                  lastName: firebaseUser.displayName?.split(' ')[1] || firebaseUser.uid.substring(0, 5),
                  isAdmin: false,
                  username: firebaseUser.email.split('@')[0] || "user",
                  createdAt: new Date()
                });
                console.log("Created new user profile in Firestore users collection");
              } catch (error) {
                console.error("Error creating user profile in users collection:", error);
                
                // Try creating in neurohealthhub collection as fallback
                try {
                  await setDoc(doc(db, "neurohealthhub", firebaseUser.uid), {
                    email: firebaseUser.email,
                    firstName: firebaseUser.displayName?.split(' ')[0] || "User",
                    lastName: firebaseUser.displayName?.split(' ')[1] || firebaseUser.uid.substring(0, 5),
                    isAdmin: false,
                    username: firebaseUser.email.split('@')[0] || "user",
                    type: "user",
                    createdAt: new Date()
                  });
                  console.log("Created new user profile in Firestore neurohealthhub collection");
                } catch (fallbackError) {
                  console.error("Error creating user profile in neurohealthhub collection:", fallbackError);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast({
            title: "Error",
            description: "Failed to load user profile",
            variant: "destructive",
          });
        }
      } else {
        console.log("No user is logged in");
        setUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    // Clean up listener on unmount
    return () => unsubscribe();
  }, [toast]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("Attempting login with:", email);
      
      // List of super admin emails
      const superAdminEmails = [
        "drphaniraj1965@gmail.com",
        "doctornerves@gmail.com",
        "g.rajshaker@gmail.com"
      ];
      
      // Always use real Firebase Authentication
      console.log("Attempting Firebase login");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Firebase login successful, user:", userCredential.user?.email);
      
      // Check if the user's email is verified
      if (!userCredential.user.emailVerified && !superAdminEmails.includes(email)) {
        console.log("User's email is not verified:", email);
        
        try {
          // Import the function directly to avoid circular dependencies
          const { sendEmailVerification } = await import("firebase/auth");
          
          // Send a verification email
          await sendEmailVerification(userCredential.user);
          console.log("Verification email sent to:", email);
          
          // Show toast message
          toast({
            title: "Email Verification Required",
            description: "Please check your email and verify your account before logging in.",
            duration: 6000,
          });
          
          // Sign out the user since they can't access the app yet
          await signOut(auth);
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
          
          // Redirect to the verification page
          window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
          return;
        } catch (verificationError) {
          console.error("Error sending verification email:", verificationError);
          toast({
            title: "Verification Required",
            description: "Your email is not verified. Please check your inbox or contact support.",
            variant: "destructive",
            duration: 6000,
          });
          
          // Sign out the user
          await signOut(auth);
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
          
          // Redirect to the verification page
          window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
          return;
        }
      }
      
      // Force token refresh to ensure tokens are valid before any Firestore operations
      const idToken = await userCredential.user.getIdToken(true);
      console.log("Auth token has been refreshed");
      
      // Check if special admin user
      if (superAdminEmails.includes(email)) {
        console.log("★ ★ ★ Super admin user detected in login function:", email);
        // Force set admin privileges for super admins regardless of Firestore data
        setIsAdmin(true);
        // Create a custom user object with admin privileges
        const userProfile: FirebaseUser = {
          uid: userCredential.user.uid,
          email: email,
          firstName: userCredential.user.displayName?.split(' ')[0] || "Admin",
          lastName: userCredential.user.displayName?.split(' ')[1] || "User",
          isAdmin: true,
          username: email.split('@')[0] || "admin",
        };
        setUser(userProfile);
        
        // Log the state we've set
        console.log("Super admin state set in login function:", {
          user: userProfile,
          isAdmin: true
        });
        return; // Skip any further Firestore checks to prevent overriding our super admin status
      }
      
      // Firebase auth state listener will handle the user state update
      // The onAuthStateChanged will trigger and fetch user data from Firestore
      // using our enhanced email-based lookup if needed
      
      toast({
        title: "Login Successful",
        description: "Welcome back to NeuroHealthHub!",
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      // Always use real Firebase registration
      console.log("Creating account with:", userData.email);
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      
      // Get the current user
      const currentUser = userCredential.user;
      console.log("Created account with ID:", currentUser.uid);
      
      // Force token refresh to ensure tokens are valid before Firestore operations
      const idToken = await currentUser.getIdToken(true);
      console.log("Auth token has been refreshed for new user");
      
      // Update display name
      await updateProfile(currentUser, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });
      
      // Import the function directly to avoid circular dependencies
      const { sendEmailVerification } = await import("firebase/auth");
      
      // Send verification email
      await sendEmailVerification(currentUser);
      console.log("Verification email sent to:", userData.email);
      
      // Store temporary user metadata in localStorage to use after verification
      try {
        localStorage.setItem(`user_pending_${currentUser.uid}`, JSON.stringify({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          mobile: userData.mobile || "",
          username: `${userData.firstName.toLowerCase()}${userData.lastName.toLowerCase()}`
        }));
      } catch (e) {
        console.warn('Could not save temporary user data to localStorage:', e);
      }
      
      // Sign out the user so they need to verify email first
      await signOut(auth);
      
      toast({
        title: "Registration Successful",
        description: "Please check your email to verify your account before logging in.",
        duration: 8000,
      });
      
      // Redirect to the verification page
      window.location.href = `/verify-email?email=${encodeURIComponent(userData.email)}`;
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: "Could not create your account",
        variant: "destructive", 
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log("Logging out user");
      
      // Always use real Firebase logout
      await signOut(auth);
      // Firebase auth state listener will handle the user state update
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "Could not log out properly",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    isAdmin,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}