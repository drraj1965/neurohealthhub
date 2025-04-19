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
      // If we don't have a current user but have an email, try to use the API to send verification
      if (email) {
        try {
          // Call our server-side API to send a verification email
          const response = await fetch(`/api/firebase-auth/users/email/${encodeURIComponent(email)}/send-verification`, {
            method: 'POST',
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Verification email sent via API:', data);
            return Promise.resolve();
          } else {
            const errorData = await response.json();
            console.error('Failed to send verification email via API:', errorData);
            return Promise.reject(new Error(errorData.message || 'Failed to send verification email. Please try logging in again.'));
          }
        } catch (error) {
          console.error('Error sending verification email via API:', error);
          return Promise.reject(new Error('Network error when sending verification email. Please try again later.'));
        }
      } else {
        return Promise.reject(new Error('No email address found. Please try logging in again.'));
      }
    }
    
    // If user is logged in, use Firebase client SDK to send verification email
    try {
      // Get the current Replit URL for the redirect
      const baseUrl = window.location.origin;
      console.log(`Using base URL for verification: ${baseUrl}`);
      
      // Configure action code settings for email verification
      const actionCodeSettings = {
        // URL you want to redirect back to after email verification
        url: `${baseUrl}/email-verified`,
        // This must be true for mobile apps
        handleCodeInApp: false,
      };
      
      // Send a verification email with custom redirect
      await sendEmailVerification(auth.currentUser, actionCodeSettings);
      return Promise.resolve();
    } catch (error) {
      console.error('Error sending verification email:', error);
      return Promise.reject(new Error('Failed to send verification email. Please try again later.'));
    }
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