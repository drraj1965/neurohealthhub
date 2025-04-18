import React from 'react';
import { AuthProvider as FirebaseAuthProvider } from './auth-context';
import { DevAuthProvider } from './dev-auth-provider';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Use the development auth provider in dev mode, production auth provider otherwise
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    return <DevAuthProvider>{children}</DevAuthProvider>;
  }
  
  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
}

// Re-export the useAuth hook
export { useAuth } from './auth-context';