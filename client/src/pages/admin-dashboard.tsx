import React from "react";
import { Helmet } from "react-helmet";
import AppLayout from "@/components/layout/app-layout";
import AdminDashboardContent from "@/components/dashboard/admin-dashboard";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

const AdminDashboard: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading && !isAdmin) {
      setLocation("/login");
    }
  }, [isLoading, isAdmin, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | NeuroHealthHub</title>
      </Helmet>
      <AppLayout>
        <AdminDashboardContent />
      </AppLayout>
    </>
  );
};

export default AdminDashboard;
