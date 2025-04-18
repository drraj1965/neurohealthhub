import React, { createContext, useContext, useState } from "react";
import { FirebaseUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: FirebaseUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DevAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>({
    uid: "dev-user-123",
    email: "dev@example.com",
    firstName: "Dev",
    lastName: "User",
    isAdmin: false,
    username: "devuser",
  });
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  console.log("DevAuthProvider initialized - providing development user");

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate admin login
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
          username: "Raju Gentleman",
        });
        setIsAdmin(false);
      }
      
      toast({
        title: "Login Successful (Dev Mode)",
        description: "Welcome to development mode!",
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
      // Set a default user
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

  const contextValue: AuthContextType = {
    user,
    isAdmin,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export function useDevAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useDevAuth must be used within a DevAuthProvider");
  }
  return context;
}