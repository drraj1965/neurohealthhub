import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { fetchUserProfile } from "@/lib/fetchUserProfile";
import { onAuthStateChanged, updateProfile, User as FirebaseUser } from "firebase/auth";

interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on startup
  useEffect(() => {
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  // Auth state change listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);

      if (firebaseUser) {
        const profileData = await fetchUserProfile(firebaseUser.uid);
        const fullProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          firstName: profileData.firstName,
          lastName: profileData.lastName,
        };
        setProfile(fullProfile);
        localStorage.setItem("userProfile", JSON.stringify(fullProfile));

        const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
        if (firebaseUser.displayName !== fullName && fullName) {
          await updateProfile(firebaseUser, { displayName: fullName });
        }
      } else {
        setProfile(null);
        localStorage.removeItem("userProfile");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);