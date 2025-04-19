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
  
  // Extract verification parameters from the URL
  const getVerificationParameters = useCallback(() => {
    const searchParams = new URLSearchParams(window.location.search);
    
    // For Firebase native verification links
    const oobCode = searchParams.get('oobCode');
    const mode = searchParams.get('mode');
    const apiKey = searchParams.get('apiKey');
    
    // For our custom token (fallback)
    const token = searchParams.get('token');
    
    // Log for debugging
    console.log(`Verification Parameters - Mode: ${mode}, OobCode: ${oobCode ? 'present' : 'missing'}, Token: ${token ? 'present' : 'missing'}`);
    
    return { oobCode, mode, apiKey, token };
  }, []);

  // Handle the verification process
  useEffect(() => {
    const verifyEmail = async () => {
      const params = getVerificationParameters();
      
      // Handle Firebase's native verification links
      if (params.oobCode && params.mode === 'verifyEmail') {
        try {
          console.log('Verifying email with Firebase Auth native flow');
          
          // Apply the action code to verify the email
          await applyActionCode(auth, params.oobCode);
          
          // Check if we need to add the user to Firestore database
          const currentUser = auth.currentUser;
          
          // Add the verified user to the database via server API
          if (currentUser) {
            try {
              // Force refresh the token to include the updated emailVerified claim
              await currentUser.getIdToken(true);
              
              // Call our server-side API to handle adding user to Firestore
              const response = await fetch('/api/firebase-auth/users/verified', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  uid: currentUser.uid,
                  temporaryData: null
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
          console.error('Error verifying email with Firebase:', error);
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
        return;
      }
      
      // Handle our custom token verification as a fallback
      if (params.token) {
        try {
          // Decode the token
          const tokenData = JSON.parse(Buffer.from(params.token, 'base64').toString());
          console.log('Custom token data:', tokenData);
          
          // Check if the token is expired
          if (tokenData.expires && tokenData.expires < Date.now()) {
            setStatus('error');
            setMessage('This verification link has expired. Please request a new verification email.');
            return;
          }
          
          // Call our server API to verify the email and update the user's status
          const response = await fetch('/api/firebase-auth/users/verified', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uid: tokenData.uid,
              email: tokenData.email,
              temporaryData: null
            }),
          });
          
          if (response.ok) {
            // Set success status
            setStatus('success');
            setMessage(`Your email (${tokenData.email}) has been successfully verified! You can now log in to access all features.`);
            console.log('User successfully verified and added to Firestore');
            return;
          } else {
            setStatus('error');
            setMessage('Verification failed. Please try again or contact support.');
            console.warn('Failed to verify user with server');
            return;
          }
        } catch (error: any) {
          console.error('Error verifying email with custom token:', error);
          setStatus('error');
          setMessage('Invalid verification link. The token may be corrupted or expired.');
          return;
        }
      }
      
      // If we get here, there's no valid verification parameter
      setStatus('error');
      setMessage('Invalid verification link. The link may be malformed or has expired.');
    };
    
    verifyEmail();
  }, [getVerificationParameters]);
  
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