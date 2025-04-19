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
              
              // Use enhanced persistence methods to ensure user is saved to Firestore
              try {
                console.log('Using enhanced persistence to add verified user to database...');
                
                // Get first/last name from temporary data or display name
                const firstName = temporaryData?.firstName || 
                  (currentUser.displayName ? currentUser.displayName.split(' ')[0] : undefined);
                
                const lastName = temporaryData?.lastName || 
                  (currentUser.displayName ? currentUser.displayName.split(' ').slice(1).join(' ') : undefined);
                
                // Import direct firebase access
                const { directCreateUserInFirestore } = await import('@/lib/firebase-direct');
                
                // Try to directly create the user with multiple methods
                const directResult = await directCreateUserInFirestore({
                  uid: currentUser.uid,
                  email: currentUser.email,
                  displayName: currentUser.displayName,
                  firstName: firstName || '',
                  lastName: lastName || '',
                  emailVerified: true
                });
                
                if (directResult) {
                  console.log('User successfully added to Firestore with direct approach');
                } else {
                  console.warn('Direct approach failed, trying helper function');
                  
                  // Call our helper function as fallback
                  const helperResult = await ensureUserInFirestore(
                    currentUser.uid, 
                    currentUser.email || '',
                    firstName,
                    lastName
                  );
                  
                  if (helperResult) {
                    console.log('User successfully added to Firestore with helper function');
                  } else {
                    console.warn('Helper function failed too, trying basic approach');
                    
                    // Basic approach as last resort
                    const { getFirestore, doc, setDoc } = await import('firebase/firestore');
                    const db = getFirestore();
                    
                    // Create a basic user object with essential fields only
                    const basicUserData = {
                      uid: currentUser.uid,
                      email: currentUser.email,
                      firstName: firstName || 'User',
                      lastName: lastName || '',
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      emailVerified: true,
                      isAdmin: false
                    };
                    
                    // Add with merge option and minimal data
                    await setDoc(doc(db, 'users', currentUser.uid), basicUserData, { merge: true });
                    console.log('User successfully added to Firestore with basic approach');
                  }
                }
                
                // Always try the server API too for synchronization
                try {
                  console.log('Also trying server API to ensure synchronization...');
                  fetch('/api/firebase-auth/users/verified', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      uid: currentUser.uid,
                      email: currentUser.email,
                      temporaryData: temporaryData
                    }),
                  }).then(response => {
                    if (response.ok) {
                      console.log('Server API also succeeded in adding user');
                    } else {
                      console.warn('Server API failed, but client-side approaches were tried');
                    }
                  }).catch(err => {
                    console.warn('Server API error (non-blocking):', err);
                  });
                } catch (serverApiError) {
                  console.warn('Server API attempt error (non-blocking):', serverApiError);
                }
                
              } catch (error) {
                console.error('All approaches to add user to Firestore failed:', error);
                
                // Make one final desperate attempt without any fancy code
                try {
                  const { getFirestore, doc, setDoc } = await import('firebase/firestore');
                  const db = getFirestore();
                  await setDoc(doc(db, 'users', currentUser.uid), {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    verified: true,
                    timestamp: new Date()
                  });
                } catch (finalError) {
                  console.error('Final desperate attempt also failed:', finalError);
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
          
          // Use enhanced approaches to ensure user is in Firestore
          console.log('Using enhanced persistence for custom token verification...');
          
          // Get first/last name from temporary data
          const firstName = temporaryData?.firstName || tokenData.email.split('@')[0];
          const lastName = temporaryData?.lastName || '';
          
          // Import direct firebase access
          try {
            const { directCreateUserInFirestore } = await import('@/lib/firebase-direct');
            
            // Try direct approach first
            const directResult = await directCreateUserInFirestore({
              uid: tokenData.uid,
              email: tokenData.email,
              firstName,
              lastName,
              emailVerified: true
            });
            
            if (directResult) {
              setStatus('success');
              setMessage(`Your email (${tokenData.email}) has been successfully verified! You can now log in to access all features.`);
              console.log('User successfully verified and added to Firestore with direct approach');
              return;
            }
          } catch (directError) {
            console.error('Direct approach failed:', directError);
          }
          
          // Try our helper function
          try {
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
          } catch (helperError) {
            console.error('Helper approach failed:', helperError);
          }
          
          // Try server API
          try {
            console.log('Previous approaches failed, trying server API...');
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
              console.log('User successfully verified and added to Firestore via server API');
              return;
            }
          } catch (apiError) {
            console.error('Server API approach failed:', apiError);
          }
          
          // If all above approaches failed, try client-side fallback
          console.warn('All previous approaches failed, trying last resort client-side fallback');
          
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