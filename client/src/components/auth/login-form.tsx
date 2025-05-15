import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, type LoginData } from "@shared/schema";
import { loginUser } from "@/lib/firebase-service";
import { useAuth } from "@/context/auth-context";

const LoginForm: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      console.log("User already logged in, staying on login page as requested");
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

      const result: any = await loginUser(data.email, data.password);
      console.log("Login result:", result);

      toast({
        title: "Login successful",
        description: "Welcome back to NeuroHealthHub!",
      });

      // Super Admin Logic
      const superAdminEmails = [
        "drphaniraj1965@gmail.com",
        "doctornerves@gmail.com",
        "g.rajshaker@gmail.com",
      ];
      const isSuperAdmin = superAdminEmails.includes(data.email.toLowerCase());
      const isDoctorAdmin = data.email.toLowerCase().endsWith("@doctor.com");

      let redirectTarget = "/user-dashboard";
      if (isSuperAdmin) {
        redirectTarget = "/super-admin";
      } else if (isDoctorAdmin) {
        redirectTarget = "/admin-dashboard";
      }

      console.log("Redirecting to:", redirectTarget);
      sessionStorage.setItem("post_login_redirect", redirectTarget);

      setTimeout(() => {
        window.location.href = redirectTarget;
      }, 200);

    } catch (error: any) {
      console.error("Login error:", error);

      if (error.code === "auth/too-many-requests") {
        toast({
          title: "Too many login attempts",
          description: "You have been temporarily locked out. Please wait a few minutes before trying again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Login failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="email">Email</FormLabel>
              <FormControl>
                <Input
                  id="email"
                  name="email"
                  autoComplete="email"
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
              <FormLabel htmlFor="password">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...field}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              <FormItem className="flex flex-row items-center space-x-2">
                <FormControl>
                  <Checkbox
                    id="rememberMe"
                    name="rememberMe"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormLabel htmlFor="rememberMe" className="text-sm">
                  Remember me
                </FormLabel>
              </FormItem>
            )}
          />
          <div className="text-sm">
            <Link href="#" className="font-medium text-primary-600 hover:text-primary-500">
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>
      <div className="mt-6 text-center">
        <p className="text-sm">
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