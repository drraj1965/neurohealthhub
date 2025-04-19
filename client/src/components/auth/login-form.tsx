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

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Super admin emails list
      const superAdminEmails = [
        "drphaniraj1965@gmail.com",
        "doctornerves@gmail.com",
        "g.rajshaker@gmail.com"
      ];
      
      // Redirect to appropriate dashboard
      if (user.email && superAdminEmails.includes(user.email)) {
        console.log("Super admin already logged in, redirecting to super admin dashboard");
        setLocation("/super-admin");
      } else {
        console.log("User already logged in, redirecting to dashboard");
        setLocation("/dashboard");
      }
    }
  }, [user, setLocation]);

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
      
      // Super admin emails list (should match the one in auth-context.tsx)
      const superAdminEmails = [
        "drphaniraj1965@gmail.com",
        "doctornerves@gmail.com",
        "g.rajshaker@gmail.com"
      ];
      
      // Redirect to appropriate dashboard based on email
      if (superAdminEmails.includes(data.email)) {
        console.log("Super admin detected, redirecting to super admin page");
        // Increase the delay to ensure auth state is fully updated and super admin status is set
        // Also store the destination in sessionStorage to handle potential page refresh issues
        window.sessionStorage.setItem("redirect_after_login", "/super-admin");
        setTimeout(() => {
          console.log("EXECUTING REDIRECT to /super-admin now");
          setLocation("/super-admin");
        }, 1500); // Increased delay for super admin
      } else {
        console.log("Redirecting to regular dashboard");
        // Add a slight delay to ensure auth state is fully updated
        window.sessionStorage.setItem("redirect_after_login", "/dashboard");
        setTimeout(() => {
          console.log("EXECUTING REDIRECT to /dashboard now");
          setLocation("/dashboard");
        }, 1000);
      }
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
