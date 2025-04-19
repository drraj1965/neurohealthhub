import React, { useState } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import AuthLayout from "@/components/auth/auth-layout";
import LoginForm from "@/components/auth/login-form";
import LogoutHandler from "@/components/auth/logout-handler";

const Login: React.FC = () => {
  const [logoutComplete, setLogoutComplete] = useState(false);
  
  const handleLogoutComplete = () => {
    console.log("Logout completed, showing login form");
    setLogoutComplete(true);
  };
  
  return (
    <>
      <Helmet>
        <title>Login | NeuroHealthHub</title>
      </Helmet>
      
      {/* This component will handle logout if a user is already logged in */}
      <LogoutHandler onLogoutComplete={handleLogoutComplete} />
      
      <AuthLayout 
        title="Welcome Back" 
        subtitle="Sign in to your account"
      >
        {/* Show a clear option to force logout if persistent login issues */}
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-blue-700">
              Having trouble logging in? Firebase authentication might be cached.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Clear all possible Firebase auth storage
                localStorage.clear();
                sessionStorage.clear();
                document.cookie.split(";").forEach(function(c) {
                  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
                window.location.href = "/login";
              }}
            >
              Force Logout
            </Button>
          </div>
        </div>

        <LoginForm />
      </AuthLayout>
    </>
  );
};

export default Login;
