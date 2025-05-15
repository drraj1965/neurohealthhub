import React, { useEffect, useState } from "react";
import { fetchUserProfile } from "@/lib/fetchUserProfile";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import UserDashboardContent from "@/components/dashboard/user-dashboard";

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");

  useEffect(() => {
    if (user) {
      fetchUserProfile(user.uid).then(profile => {
        setName(`${profile.firstName} ${profile.lastName}`);
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome, {name || user.email}</h1>
      <UserDashboardContent />
    </div>
  );
};

export default UserDashboard;