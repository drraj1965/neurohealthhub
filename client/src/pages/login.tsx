import React from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import AuthLayout from "@/components/auth/auth-layout";
import LoginForm from "@/components/auth/login-form";

const Login: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Login | NeuroHealthHub</title>
      </Helmet>
      <AuthLayout 
        title="Welcome Back" 
        subtitle="Sign in to your account"
      >
        <LoginForm />
      </AuthLayout>
    </>
  );
};

export default Login;
