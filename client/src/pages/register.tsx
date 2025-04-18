import React from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import AuthLayout from "@/components/auth/auth-layout";
import RegisterForm from "@/components/auth/register-form";

const Register: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Create Account | NeuroHealthHub</title>
      </Helmet>
      <AuthLayout 
        title="Create Account" 
        subtitle="Join NeuroHealthHub today"
      >
        <RegisterForm />
      </AuthLayout>
    </>
  );
};

export default Register;
