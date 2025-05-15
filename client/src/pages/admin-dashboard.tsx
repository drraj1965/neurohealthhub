import React, { useEffect, useState } from "react";
import { fetchUserProfile } from "@/lib/fetchUserProfile";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import AdminDashboardComponent from "@/components/dashboard/admin-dashboard";

const AdminDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);

  if (!profile) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <AdminDashboardComponent userName={`${profile.firstName} ${profile.lastName}`} />;

};

export default AdminDashboardPage;