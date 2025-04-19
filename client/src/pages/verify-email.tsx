import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import VerifyEmailMessage from '@/components/auth/verify-email-message';
import { auth } from '@/lib/firebase';
import { sendEmailVerification } from 'firebase/auth';

export default function VerifyEmail() {
  const [email, setEmail] = useState<string | null>(null);
  const [, navigate] = useLocation();
  
  // Extract email from query parameters or localStorage
  useEffect(() => {
    // Try to get email from query parameters first
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    
    if (emailParam) {
      setEmail(emailParam);
      return;
    }
    
    // If no email in query, check if there's a current user
    if (auth.currentUser && auth.currentUser.email) {
      setEmail(auth.currentUser.email);
      return;
    }
    
    // As a last resort, check localStorage for temp data
    try {
      // Look for any pending user data in localStorage
      const localStorageKeys = Object.keys(localStorage);
      const pendingUserKey = localStorageKeys.find(key => key.startsWith('user_pending_'));
      
      if (pendingUserKey) {
        const pendingUserData = JSON.parse(localStorage.getItem(pendingUserKey) || '{}');
        if (pendingUserData.email) {
          setEmail(pendingUserData.email);
          return;
        }
      }
    } catch (e) {
      console.error('Error retrieving email from localStorage:', e);
    }
  }, []);

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (!auth.currentUser) {
      // If we don't have a current user but have an email, try to sign in first
      if (email) {
        // We can't actually sign in without a password, so just show a message
        return Promise.reject(new Error('You need to log in again to resend the verification email'));
      }
      return Promise.reject(new Error('No user is currently signed in'));
    }
    
    return sendEmailVerification(auth.currentUser);
  };

  return (
    <>
      <Helmet>
        <title>Verify Email | NeuroHealthHub</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        <VerifyEmailMessage 
          email={email || undefined} 
          onResendClick={handleResendVerification} 
        />
      </div>
    </>
  );
}