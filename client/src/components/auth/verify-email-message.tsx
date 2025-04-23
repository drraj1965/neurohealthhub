import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Mail, AlertCircle, RefreshCw } from "lucide-react";
import { auth } from "@/lib/firebase-service";
import { sendEmailVerification } from "firebase/auth";

interface VerifyEmailMessageProps {
  email?: string;
  onResendClick?: () => Promise<void>;
}

export default function VerifyEmailMessage({ email, onResendClick }: VerifyEmailMessageProps) {
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [, navigate] = useLocation();

  const handleResendVerification = async () => {
    if (onResendClick) {
      setIsResending(true);
      try {
        await onResendClick();
        toast({
          title: "Verification Email Sent",
          description: "Please check your inbox for the verification link.",
        });
      } catch (error) {
        console.error("Error resending verification email:", error);
        toast({
          title: "Error",
          description: "Could not resend verification email. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsResending(false);
      }
      return;
    }

    // Default implementation if no onResendClick provided
    if (auth.currentUser) {
      setIsResending(true);
      try {
        // Get the current Replit URL for the redirect
        const baseUrl = window.location.origin;
        console.log(`Using base URL for resend verification: ${baseUrl}`);
        
        // Configure action code settings for email verification
        const actionCodeSettings = {
          // URL you want to redirect back to after email verification
          url: `${baseUrl}/email-verified`,
          // This must be true for mobile apps
          handleCodeInApp: false,
        };
        
        // Send verification email with custom redirect
        await sendEmailVerification(auth.currentUser, actionCodeSettings);
        toast({
          title: "Verification Email Sent",
          description: "Please check your inbox for the verification link.",
        });
      } catch (error) {
        console.error("Error sending verification email:", error);
        toast({
          title: "Error",
          description: "Could not send verification email. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsResending(false);
      }
    } else {
      toast({
        title: "Error",
        description: "You need to be logged in to request a verification email.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50">
            <Mail className="w-8 h-8 text-blue-500" />
          </div>
          <CardTitle className="text-2xl text-center">Verify Your Email</CardTitle>
          <CardDescription className="text-center">
            We've sent a verification link to
            {email ? <span className="font-medium"> {email}</span> : " your email address"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-md flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-yellow-700">
              <p className="font-medium">Important:</p>
              <p>You must verify your email address before you can access the NeuroHealthHub platform.</p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <p>1. Check your email inbox (and spam folder)</p>
            <p>2. Click the verification link in the email</p>
            <p>3. Your account will be automatically activated</p>
            <p>4. Return to the login page to sign in</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-medium text-blue-700 mb-1">Automatic Verification Process:</h4>
            <p className="text-sm text-blue-600">
              Our system has been upgraded to automatically process your verification. As soon as you click the link in your email, your account will be fully activated - no additional steps required!
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleResendVerification}
            disabled={isResending}
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Resend verification email"
            )}
          </Button>
          <Button 
            variant="link" 
            className="w-full"
            onClick={() => navigate("/")}
          >
            Return to login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}