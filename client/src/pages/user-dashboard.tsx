import React from "react";
import { Helmet } from "react-helmet";
import AppLayout from "@/components/layout/app-layout";
import UserDashboardContent from "@/components/dashboard/user-dashboard";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

const UserDashboard: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard | NeuroHealthHub</title>
      </Helmet>
      <AppLayout>
        <UserDashboardContent />
      </AppLayout>
    </>
  );
};

export default UserDashboard;
