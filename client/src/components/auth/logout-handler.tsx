import React, { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

interface LogoutHandlerProps {
  onLogoutComplete?: () => void;
}

/**
 * Component that automatically logs out any authenticated user.
 * Use this on pages where you want to ensure no user is logged in.
 */
const LogoutHandler: React.FC<LogoutHandlerProps> = ({ onLogoutComplete }) => {
  const { user, isLoading, logout } = useAuth();
  
  useEffect(() => {
    // If a user is detected, log them out automatically
    const handleLogout = async () => {
      if (user && !isLoading) {
        console.log("LogoutHandler: User detected, logging out...");
        try {
          await logout();
          console.log("LogoutHandler: Logout successful");
          
          // Callback after successful logout
          if (onLogoutComplete) {
            onLogoutComplete();
          }
          
          // Clear any session/local storage data that might be persisting the auth state
          localStorage.removeItem("firebase:authUser");
          sessionStorage.removeItem("firebase:authUser");
          localStorage.removeItem("redirect_after_login");
          sessionStorage.removeItem("redirect_after_login");
          
          // Force reload to ensure all state is cleared from memory
          window.location.reload();
        } catch (error) {
          console.error("LogoutHandler: Error during logout:", error);
        }
      }
    };
    
    handleLogout();
  }, [user, isLoading, logout, onLogoutComplete]);
  
  // This component doesn't render anything visible
  return null;
};

export default LogoutHandler;