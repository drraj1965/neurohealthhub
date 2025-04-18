import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
      
      if (firebaseUser) {
        try {
          console.log("User logged in with ID:", firebaseUser.uid);
          
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const doctorDoc = await getDoc(doc(db, 'doctors', firebaseUser.uid));
          
          if (userDoc.exists()) {
            console.log("Regular user found in Firestore");
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              firstName: userData.firstName || "",
              lastName: userData.lastName || "",
              mobile: userData.mobile || "",
              isAdmin: userData.isAdmin || false,
              username: userData.username || "",
            });
            setIsAdmin(userData.isAdmin || false);
          } else if (doctorDoc.exists()) {
            console.log("Doctor found in Firestore");
            const doctorData = doctorDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              firstName: doctorData.firstName || "",
              lastName: doctorData.lastName || "",
              mobile: doctorData.mobile || "",
              isAdmin: true,
              username: doctorData.username || "",
            });
            setIsAdmin(true);
          } else {
            console.log("No user profile found, using Firebase data");
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
              await setDoc(doc(db, "users", firebaseUser.uid), {
                email: firebaseUser.email,
                firstName: firebaseUser.displayName?.split(' ')[0] || "User",
                lastName: firebaseUser.displayName?.split(' ')[1] || firebaseUser.uid.substring(0, 5),
                isAdmin: false,
                username: firebaseUser.email.split('@')[0] || "user",
                createdAt: new Date()
              });
              console.log("Created new user profile in Firestore");
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
      
      if (isDev && email.includes('doctor')) {
        console.log("DEV MODE: Using doctor mock login");
        // For development, use mock doctor data
        setUser(mockDoctorUser);
        setIsAdmin(true);
        
        toast({
          title: "Login Successful (Dev Mode)",
          description: "Welcome to development mode, Doctor!",
        });
      } else if (isDev) {
        console.log("DEV MODE: Using regular user mock login");
        // For development, use mock user data
        setUser(mockRegularUser);
        setIsAdmin(false);
        
        toast({
          title: "Login Successful (Dev Mode)",
          description: "Welcome back to development mode!",
        });
      } else {
        // Real Firebase login
        console.log("Attempting Firebase login");
        await signInWithEmailAndPassword(auth, email, password);
        // Firebase auth state listener will handle the user state update
        
        toast({
          title: "Login Successful",
          description: "Welcome back to NeuroHealthHub!",
        });
      }
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
      if (isDev) {
        console.log("DEV MODE: Creating mock user account");
        // For development, create and use mock user
        const newUser: FirebaseUser = {
          uid: `user-${Date.now().toString()}`,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          mobile: userData.mobile || "",
          isAdmin: false,
          username: `${userData.firstName.toLowerCase()}${userData.lastName.toLowerCase()}`,
        };
        
        setUser(newUser);
        setIsAdmin(false);
        
        toast({
          title: "Registration Successful (Dev Mode)",
          description: "Your account has been created",
        });
      } else {
        // Real Firebase registration
        console.log("Creating account with:", userData.email);
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        
        // Get the current user
        const currentUser = userCredential.user;
        console.log("Created account with ID:", currentUser.uid);
        
        // Update display name
        await updateProfile(currentUser, {
          displayName: `${userData.firstName} ${userData.lastName}`
        });
        
        // Store additional user data in Firestore
        await setDoc(doc(db, "users", currentUser.uid), {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          mobile: userData.mobile || "",
          isAdmin: false,
          username: `${userData.firstName.toLowerCase()}${userData.lastName.toLowerCase()}`,
          createdAt: new Date()
        });
        
        console.log("User profile created in Firestore");
        
        toast({
          title: "Registration Successful",
          description: "Your account has been created",
        });
      }
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
      
      if (isDev) {
        console.log("DEV MODE: Logging out mock user");
        // Simple logout for development
        setUser(null);
        setIsAdmin(false);
      } else {
        // Real Firebase logout
        await signOut(auth);
        // Firebase auth state listener will handle the user state update
      }
      
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