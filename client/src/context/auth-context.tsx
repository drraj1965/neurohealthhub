import React, { createContext, useContext, useState } from "react";
import { FirebaseUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Define AuthContext type
interface AuthContextType {
  user: FirebaseUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

// Create context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

// Sample user data (for development only)
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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("Login attempt with:", email);

      // Set the appropriate user based on email
      if (email.includes("doctor")) {
        setUser(mockDoctorUser);
        setIsAdmin(true);
      } else {
        setUser(mockRegularUser);
        setIsAdmin(false);
      }

      toast({
        title: "Login successful",
        description: "Welcome to NeuroHealthHub!",
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
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
      console.log("Registration attempt with:", userData.email);

      // Create a new user with the provided data
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
        title: "Registration successful",
        description: "Welcome to NeuroHealthHub!",
      });
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
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
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
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