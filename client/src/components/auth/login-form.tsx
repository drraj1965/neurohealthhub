import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, type LoginData } from "@shared/schema";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";

const LoginForm: React.FC = () => {
  const { login, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If a user visits the login page directly while already logged in, we don't automatically redirect.
  // This is intentional to make the login page always accessible at the root URL.
  useEffect(() => {
    if (user) {
      console.log("User is already logged in, but staying on login page as requested");
      // We don't redirect automatically when user first arrives on the login page
    }
  }, [user]);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    try {
      console.log("Login attempt with:", data.email);
      
      // Use auth context login function - the result could be a user object or undefined
      const result: any = await login(data.email, data.password);
      console.log("Login result:", result);
      
      // Check if the login result indicates email verification is needed
      if (result && typeof result === 'object' && 'needsVerification' in result && result.needsVerification) {
        console.log("User email not verified, redirecting to verification page");
        toast({
          title: "Email verification required",
          description: "Please check your inbox for a verification link and follow the instructions.",
        });
        
        // Redirect to email verification page with the email address
        setLocation(`/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }
      
      console.log("LOGIN SUCCESS - Firebase auth completed");
      
      toast({
        title: "Login successful",
        description: "Welcome back to NeuroHealthHub!",
      });
      
      // Redirect to the appropriate dashboard after successful login
      console.log("Login successful - redirecting to appropriate dashboard");
      
      // Check if user should go to super admin or admin dashboard
      const superAdminEmails = [
        "drphaniraj1965@gmail.com",
        "doctornerves@gmail.com",
        "g.rajshaker@gmail.com"
      ];
                           
      const isSuperAdmin = data.email && superAdminEmails.includes(data.email);
      const isDoctor = data.email.endsWith("@doctor.com");
      
      // Get the current Firebase user
      const currentUser = auth.currentUser;
      
      // Take direct action without relying on complex imports
      if (currentUser) {
        console.log('Current user found after login, creating user profile...');
        
        // Import our local storage module
        const { saveUserLocally } = await import('@/lib/local-user-store');
        
        // Create user object for local storage
        const userProfile = {
          uid: currentUser.uid,
          email: currentUser.email || data.email,
          firstName: currentUser.displayName ? currentUser.displayName.split(' ')[0] : data.email.split('@')[0],
          lastName: currentUser.displayName ? currentUser.displayName.split(' ').slice(1).join(' ') : '',
          isAdmin: isSuperAdmin || isDoctor,
          emailVerified: currentUser.emailVerified,
          username: data.email.split('@')[0],
          updatedAt: new Date().toISOString()
        };
        
        // Save user locally first (this will always work)
        saveUserLocally(userProfile);
        console.log('User saved to local storage for reliability');
        
        try {
          // Try to create the user record in Firestore as well (but don't depend on it)
          const { getFirestore, doc, setDoc } = await import('firebase/firestore');
          const db = getFirestore();
          
          // Simple direct update for user document
          await setDoc(doc(db, 'users', currentUser.uid), userProfile, { merge: true });
          console.log('User document also updated in Firestore as backup');
        } catch (firestoreError) {
          console.error('Firestore update failed, but local storage is working:', firestoreError);
          // Continue to redirect anyway since we have local storage
        }
        
        // Now redirect directly using window.location for guaranteed navigation
        console.log('Redirecting user to appropriate dashboard...');
        
        // Save the target URL to session storage for reliable redirection
        try {
          const redirectTarget = isSuperAdmin 
            ? "/super-admin" 
            : (isDoctor ? "/admin" : "/dashboard");
          
          // Store redirect target in session storage
          sessionStorage.setItem('post_login_redirect', redirectTarget);
          console.log('Saved redirect target to session storage:', redirectTarget);
          
          // Try to save admin to session if applicable
          if (isSuperAdmin) {
            const { saveAdminToSession } = await import('@/lib/admin-preload');
            saveAdminToSession(userProfile);
            console.log('Saved super admin to session for reliable access');
          }
        } catch (storageError) {
          console.error('Failed to save to session storage:', storageError);
        }
        
        // Add a small delay to ensure storage operations complete
        setTimeout(() => {
          if (isSuperAdmin) {
            window.location.href = "/super-admin";
          } else if (isDoctor) {
            window.location.href = "/admin";
          } else {
            window.location.href = "/dashboard";
          }
        }, 200);
      } else {
        console.error('No current user found after login');
        // Fallback to simple redirect with window.location for guaranteed navigation
        setTimeout(() => {
          if (isSuperAdmin) {
            window.location.href = "/super-admin";
          } else if (isDoctor) {
            window.location.href = "/admin";
          } else {
            window.location.href = "/dashboard";
          }
        }, 100);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Check for special error conditions like email verification
      if (error.message && error.message.includes("verification")) {
        toast({
          title: "Email verification required",
          description: error.message,
          variant: "destructive",
        });
        
        // Redirect to email verification page if the error is about verification
        if (data.email) {
          setLocation(`/verify-email?email=${encodeURIComponent(data.email)}`);
        }
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  {...field} 
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter your password" 
                    {...field} 
                    disabled={isLoading}
                  />
                  <button 
                    type="button" 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormLabel className="text-sm">Remember me</FormLabel>
              </FormItem>
            )}
          />
          <div className="text-sm">
            <Link href="#" className="font-medium text-primary-600 hover:text-primary-500">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-neutral-600">
          Don't have an account?{" "}
          <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
            Sign up
          </Link>
        </p>
      </div>
    </Form>
  );
};

export default LoginForm;
