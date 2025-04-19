import { useState, useEffect, useCallback } from 'react';
import { useLocation, useRoute } from 'wouter';
import { auth } from '@/lib/firebase';
import { applyActionCode, getAuth } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function EmailVerified() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState<string>('Verifying your email address...');
  const [, navigate] = useLocation();
  
  // Extract the action code from the URL
  const getActionCode = useCallback(() => {
    // Firebase adds oobCode as a query parameter
    const searchParams = new URLSearchParams(window.location.search);
    const actionCode = searchParams.get('oobCode');
    return actionCode;
  }, []);

  // Handle the verification process
  useEffect(() => {
    const verifyEmail = async () => {
      const actionCode = getActionCode();
      
      // If there's no action code, display an error
      if (!actionCode) {
        setStatus('error');
        setMessage('Invalid verification link. The link may be malformed or has expired.');
        return;
      }
      
      try {
        // Apply the action code to verify the email
        await applyActionCode(auth, actionCode);
        
        // Check if we need to add the user to Firestore database
        const currentUser = auth.currentUser;
        
        // Add the verified user to the database via server API
        if (currentUser) {
          try {
            // Force refresh the token to include the updated emailVerified claim
            await currentUser.getIdToken(true);
            
            // Try to get any temporary user data from localStorage
            let temporaryData = null;
            try {
              const pendingUserKey = `user_pending_${currentUser.uid}`;
              const storedData = localStorage.getItem(pendingUserKey);
              
              if (storedData) {
                temporaryData = JSON.parse(storedData);
                console.log('Found temporary user data:', temporaryData);
                
                // Clean up the localStorage entry
                localStorage.removeItem(pendingUserKey);
              }
            } catch (e) {
              console.warn('Error retrieving temporary user data from localStorage:', e);
            }
            
            // Call our server-side API to handle adding user to Firestore
            const response = await fetch('/api/firebase-auth/users/verified', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                uid: currentUser.uid,
                temporaryData: temporaryData
              }),
            });
            
            if (response.ok) {
              console.log('User successfully added to Firestore after verification');
            } else {
              console.warn('Failed to add verified user to Firestore database');
            }
          } catch (dbError) {
            console.error('Error adding verified user to database:', dbError);
            // We don't change status to error as the email verification itself succeeded
          }
        }
        
        // Set success status
        setStatus('success');
        setMessage('Your email has been successfully verified! You can now log in to access all features.');
      } catch (error: any) {
        console.error('Error verifying email:', error);
        setStatus('error');
        
        // Provide specific error messages based on the error code
        if (error.code === 'auth/invalid-action-code') {
          setMessage('The verification link has expired or already been used. Please request a new verification email.');
        } else if (error.code === 'auth/user-not-found') {
          setMessage('User account not found. The account may have been deleted.');
        } else {
          setMessage(`Verification failed: ${error.message || 'Unknown error occurred'}`);
        }
      }
    };
    
    verifyEmail();
  }, [getActionCode]);
  
  // Render different content based on status
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Email Verification
          </CardTitle>
          <CardDescription className="text-center">
            NeuroHealthHub Account Verification
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center justify-center pt-4 pb-6">
          {status === 'processing' && (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
              <p className="text-center text-muted-foreground">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-center text-muted-foreground">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              <p className="text-center text-muted-foreground">{message}</p>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          {status !== 'processing' && (
            <Button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto"
            >
              Go to Login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}