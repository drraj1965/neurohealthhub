import React from "react";
import { Link } from "wouter";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="flex min-h-screen">
      {/* Left side with background image for larger screens */}
      <div className="hidden lg:block lg:w-1/2 bg-primary-700 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/90 to-primary-900/90"></div>
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white px-12">
          <h1 className="text-4xl font-bold mb-6">NeuroHealthHub</h1>
          <p className="text-xl mb-8">Your direct line to neurological healthcare professionals</p>
          <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
            <div className="aspect-square rounded-lg overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=500&h=500" 
                alt="Medical professional" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="aspect-square rounded-lg overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=500&h=500" 
                alt="Patient-doctor interaction" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="aspect-square rounded-lg overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=500&h=500" 
                alt="Medical consultation" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="aspect-square rounded-lg overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1666214280429-34de0e9d9372?auto=format&fit=crop&w=500&h=500" 
                alt="Healthcare dashboard" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right side with auth forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-neutral-800">{title}</h2>
            <p className="text-neutral-500 mt-2">{subtitle}</p>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
