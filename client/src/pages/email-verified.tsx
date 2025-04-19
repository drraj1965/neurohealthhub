import { useState, useEffect, useCallback } from 'react';
import { useLocation, useRoute } from 'wouter';
import { auth } from '@/lib/firebase';
import { applyActionCode, getAuth } from 'firebase/auth';
import { ensureUserInFirestore } from '@/lib/firestore-helpers';
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
              
              // Get any temporary user data stored in localStorage
              let temporaryData = null;
              try {
                const localStorageKey = `user_pending_${currentUser.uid}`;
                const storedData = localStorage.getItem(localStorageKey);
                if (storedData) {
                  temporaryData = JSON.parse(storedData);
                  console.log('Retrieved temporary user data from localStorage:', temporaryData);
                }
              } catch (localStorageError) {
                console.error('Error retrieving temporary data from localStorage:', localStorageError);
              }
              
              // Use our new helper function to ensure user is in Firestore
              try {
                console.log('Using ensureUserInFirestore helper to add user to database...');
                
                // Get first/last name from temporary data or display name
                const firstName = temporaryData?.firstName || 
                  (currentUser.displayName ? currentUser.displayName.split(' ')[0] : undefined);
                
                const lastName = temporaryData?.lastName || 
                  (currentUser.displayName ? currentUser.displayName.split(' ').slice(1).join(' ') : undefined);
                
                // Call our helper function (which will try API endpoint first)
                const result = await ensureUserInFirestore(
                  currentUser.uid, 
                  currentUser.email || '',
                  firstName,
                  lastName
                );
                
                if (result) {
                  console.log('User successfully added to Firestore after verification');
                } else {
                  console.warn('Failed to add user to Firestore with helper, trying direct approach');
                  
                  // Direct API call as fallback
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
                    console.log('User successfully added to Firestore via direct API call');
                  } else {
                    console.warn('All server approaches failed, trying client-side fallback');
                    throw new Error('All server approaches failed');
                  }
                }
              } catch (serverApiError) {
                console.error('All server approaches failed:', serverApiError);
                
                // Last resort: client-side Firestore approach
                try {
                  console.log('Attempting last-resort client-side approach to add user to Firestore...');
                  
                  // Import Firestore functions directly for client-side
                  const { getFirestore, doc, setDoc } = await import('firebase/firestore');
                  const db = getFirestore();
                  
                  // Create a basic user object
                  const userData = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName,
                    firstName: temporaryData?.firstName || (currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'User'),
                    lastName: temporaryData?.lastName || 
                      (currentUser.displayName ? currentUser.displayName.split(' ').slice(1).join(' ') : ''),
                    username: temporaryData?.username || 
                      (currentUser.email ? currentUser.email.split('@')[0] : 'user'),
                    mobile: temporaryData?.mobile || '',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    emailVerified: true,
                    isAdmin: false,
                  };
                  
                  // Try to add to users collection
                  await setDoc(doc(db, 'users', currentUser.uid), userData);
                  console.log('User successfully added to Firestore via last-resort client-side approach');
                } catch (clientFallbackError) {
                  console.error('All approaches to add user to Firestore failed:', clientFallbackError);
                }
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
          
          // Get any temporary user data stored in localStorage
          let temporaryData = null;
          try {
            const localStorageKey = `user_pending_${tokenData.uid}`;
            const storedData = localStorage.getItem(localStorageKey);
            if (storedData) {
              temporaryData = JSON.parse(storedData);
              console.log('Retrieved temporary user data from localStorage for token verification:', temporaryData);
            }
          } catch (localStorageError) {
            console.error('Error retrieving temporary data from localStorage:', localStorageError);
          }
          
          // Use our helper function to ensure user is in Firestore
          console.log('Using ensureUserInFirestore helper for custom token verification...');
          
          // Get first/last name from temporary data
          const firstName = temporaryData?.firstName || tokenData.email.split('@')[0];
          const lastName = temporaryData?.lastName || '';
          
          // Call our helper function
          const result = await ensureUserInFirestore(
            tokenData.uid,
            tokenData.email,
            firstName,
            lastName
          );
          
          if (result) {
            // Set success status
            setStatus('success');
            setMessage(`Your email (${tokenData.email}) has been successfully verified! You can now log in to access all features.`);
            console.log('User successfully verified and added to Firestore with helper');
            return;
          }
          
          // If helper function failed, try direct server API
          console.log('Helper function failed, trying direct server API...');
          const response = await fetch('/api/firebase-auth/users/verified', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uid: tokenData.uid,
              email: tokenData.email,
              temporaryData: temporaryData
            }),
          });
          
          if (response.ok) {
            // Set success status
            setStatus('success');
            setMessage(`Your email (${tokenData.email}) has been successfully verified! You can now log in to access all features.`);
            console.log('User successfully verified and added to Firestore via direct API');
            return;
          } 
          
          // If server API failed, try client-side fallback
          console.warn('All server approaches failed, trying client-side fallback');
          
          // Import Firestore functions directly for client-side
          const { getFirestore, doc, setDoc } = await import('firebase/firestore');
          const db = getFirestore();
          
          // Create a basic user object
          const userData = {
            uid: tokenData.uid,
            email: tokenData.email,
            firstName: temporaryData?.firstName || tokenData.email.split('@')[0] || 'User',
            lastName: temporaryData?.lastName || '',
            username: temporaryData?.username || tokenData.email.split('@')[0] || 'user',
            mobile: temporaryData?.mobile || '',
            createdAt: new Date(),
            updatedAt: new Date(),
            emailVerified: true,
            isAdmin: false,
          };
          
          // Try to add to users collection
          await setDoc(doc(db, 'users', tokenData.uid), userData);
          console.log('User successfully added to Firestore via client-side fallback (custom token)');
          
          // Set success status
          setStatus('success');
          setMessage(`Your email (${tokenData.email}) has been successfully verified! You can now log in to access all features.`);
          return;
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