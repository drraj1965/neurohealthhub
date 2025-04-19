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
  
  // Extract the custom token from the URL
  const getVerificationToken = useCallback(() => {
    const searchParams = new URLSearchParams(window.location.search);
    
    // Check for our custom token parameter first
    const token = searchParams.get('token');
    
    // Log for debugging
    console.log(`Verification Token: ${token ? 'present' : 'missing'}`);
    
    return token;
  }, []);

  // Handle the verification process
  useEffect(() => {
    const verifyEmail = async () => {
      const token = getVerificationToken();
      
      // If there's no token, display an error
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. The link may be malformed or has expired.');
        return;
      }
      
      try {
        // Decode the token
        const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
        console.log('Token data:', tokenData);
        
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
            temporaryData: null // We could retrieve from localStorage if needed
          }),
        });
        
        if (response.ok) {
          // Set success status
          setStatus('success');
          setMessage(`Your email (${tokenData.email}) has been successfully verified! You can now log in to access all features.`);
          console.log('User successfully verified and added to Firestore');
        } else {
          setStatus('error');
          setMessage('Verification failed. Please try again or contact support.');
          console.warn('Failed to verify user with server');
        }
      } catch (error: any) {
        console.error('Error verifying email:', error);
        setStatus('error');
        setMessage('Invalid verification link. The token may be corrupted or expired.');
      }
    };
    
    verifyEmail();
  }, [getVerificationToken]);
  
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