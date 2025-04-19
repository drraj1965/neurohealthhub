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
      
      // Use auth context login function
      await login(data.email, data.password);
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
      
      // Wait a short time to ensure the auth state is fully processed
      setTimeout(() => {
        if (isSuperAdmin) {
          console.log("Super admin user detected, redirecting to super admin");
          setLocation("/super-admin");
        } else if (isDoctor) {
          console.log("Doctor user detected, redirecting to admin dashboard");
          setLocation("/admin");
        } else {
          console.log("Regular user detected, redirecting to user dashboard");
          setLocation("/dashboard");
        }
      }, 500);
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
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
