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

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    // Development mode - use mock data
    if (isDev) {
      console.log("DevAuthProvider initialized - providing development user");
      setUser({
        uid: "dev-user-123",
        email: "dev@example.com",
        firstName: "Dev",
        lastName: "User",
        isAdmin: false,
        username: "devuser",
      });
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }
    
    // Production mode - use Firebase auth
    console.log("Firebase Auth Provider initialized");
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed", firebaseUser ? "User logged in" : "No user");
      
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const doctorDoc = await getDoc(doc(db, 'doctors', firebaseUser.uid));
          
          if (userDoc.exists()) {
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
            // Default fallback for testing (remove in production)
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              firstName: "Test",
              lastName: "User",
              isAdmin: false,
              username: "testuser",
            });
            setIsAdmin(false);
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
        setUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast, isDev]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (isDev) {
        // Development mock login
        if (email.includes('doctor')) {
          setUser({
            uid: "doctor123",
            email: email,
            firstName: "Dr.",
            lastName: "Rajshekher",
            mobile: "+971501802970",
            isAdmin: true,
            username: "doctornerves",
          });
          setIsAdmin(true);
        } else {
          setUser({
            uid: "user123",
            email: email,
            firstName: "Rajshekher",
            lastName: "Garikapati",
            mobile: "+971501802970",
            isAdmin: false,
            username: "rajugent",
          });
          setIsAdmin(false);
        }
        
        toast({
          title: "Login Successful (Dev Mode)",
          description: "Welcome to development mode!",
        });
      } else {
        // Production login with Firebase
        await signInWithEmailAndPassword(auth, email, password);
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
        // Set a default user for development
        setUser({
          uid: "user123",
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          mobile: userData.mobile || "",
          isAdmin: false,
          username: `${userData.firstName.toLowerCase()}${userData.lastName.toLowerCase()}`,
        });
        setIsAdmin(false);
        
        toast({
          title: "Registration Successful (Dev Mode)",
          description: "Your account has been created",
        });
      } else {
        // Use Firebase registration in production
        await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        
        // Get the current user
        const currentUser = auth.currentUser;
        if (currentUser) {
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
            username: `${userData.firstName.toLowerCase()}${userData.lastName.toLowerCase()}`
          });
          
          toast({
            title: "Registration Successful",
            description: "Your account has been created",
          });
        }
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
      if (!isDev) {
        await signOut(auth);
      }
      setUser(null);
      setIsAdmin(false);
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "Could not log out properly",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}