import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseAuthUser, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { FirebaseUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Import Firebase components from our lib file instead of initializing here
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: FirebaseUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log("Auth Provider initialized");
    
    // For testing in development, set a default user
    // This allows us to bypass Firebase authentication during initial development
    if (import.meta.env.DEV) {
      console.log("Using development mode authentication");
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
  }, [toast]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Use Firebase authentication
      await signInWithEmailAndPassword(auth, email, password);
      // The useEffect with onAuthStateChanged will handle setting the user
      
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
      // Use Firebase registration
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
      await signOut(auth);
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
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
