import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuth, applyActionCode, signInWithEmailLink } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const EmailVerifiedPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [email, setEmail] = useState<string | null>(null);
  const [_, setLocation] = useLocation();

  useEffect(() => {
    const processEmailVerification = async () => {
      try {
        setLoading(true);
        
        // Get the URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        const oobCode = urlParams.get('oobCode');
        const apiKey = urlParams.get('apiKey');
        const continueUrl = urlParams.get('continueUrl');
        const lang = urlParams.get('lang') || 'en';
        
        console.log("Email verification parameters:", { mode, oobCode, apiKey, continueUrl, lang });
        
        if (!oobCode) {
          throw new Error('No action code found in URL');
        }
        
        // Get the Firebase Auth instance
        const auth = getAuth();
        
        // Apply the action code to verify the email
        await applyActionCode(auth, oobCode);
        
        // If we have a user already, get their details
        const user = auth.currentUser;
        console.log("Current user after verification:", user);
        
        if (user) {
          setEmail(user.email);
          
          // Check if user already exists in Firestore
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            // Create a new user document in Firestore
            console.log("Creating new user document in Firestore for verified user:", user.email);
            
            // Extract first name and last name from display name
            const firstName = user.displayName ? user.displayName.split(' ')[0] : '';
            const lastName = user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '';
            
            const userData = {
              email: user.email,
              firstName: firstName,
              lastName: lastName,
              mobile: user.phoneNumber || "",
              username: user.email ? user.email.split('@')[0] : 'user' + Date.now(),
              isAdmin: false,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            await setDoc(userDocRef, userData);
            console.log("New user document created successfully");
          } else {
            console.log("User already exists in Firestore");
          }
        } else {
          console.log("No user is currently signed in");
          // We don't have a user logged in - this is still a successful verification
          // but we need to handle differently (user will need to log in)
        }
        
        setSuccess(true);
        setLoading(false);
      } catch (error) {
        console.error("Error processing email verification:", error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setSuccess(false);
        setLoading(false);
      }
    };
    
    processEmailVerification();
  }, []);
  
  const handleContinue = () => {
    setLocation("/login");
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Helmet>
          <title>Verifying Email | NeuroHealthHub</title>
        </Helmet>
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-center">Verifying Email</CardTitle>
            <CardDescription className="text-center">
              Please wait while we verify your email...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-10">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Helmet>
          <title>Verification Failed | NeuroHealthHub</title>
        </Helmet>
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-center text-destructive flex items-center justify-center">
              <XCircle className="h-8 w-8 mr-2 text-destructive" />
              Verification Failed
            </CardTitle>
            <CardDescription className="text-center mt-4">
              We couldn't verify your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-4">
            <p className="mb-4">Error: {error}</p>
            <p>This might be because:</p>
            <ul className="list-disc list-inside text-left mt-2">
              <li>The verification link has expired</li>
              <li>The link has already been used</li>
              <li>There was a problem with the verification process</li>
            </ul>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleContinue}>
              Return to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Helmet>
        <title>Email Verified | NeuroHealthHub</title>
      </Helmet>
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-center text-green-600 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 mr-2 text-green-600" />
            Email Verified
          </CardTitle>
          <CardDescription className="text-center mt-4">
            Your email has been successfully verified!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-4">
          {email ? (
            <p>Thank you for verifying your email address: <strong>{email}</strong></p>
          ) : (
            <p>Thank you for verifying your email address.</p>
          )}
          <p className="mt-4">
            You can now log in to access your account and start using NeuroHealthHub.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleContinue}>
            Continue to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EmailVerifiedPage;