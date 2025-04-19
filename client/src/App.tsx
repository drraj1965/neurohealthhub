import { Route, Switch, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Welcome from "@/pages/welcome";
import NewLogin from "@/pages/new-login";  // Import the new login page
import UserDashboard from "@/pages/user-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import AskQuestion from "@/pages/ask-question";
import MyQuestions from "@/pages/my-questions";
import FirebaseTest from "@/pages/firebase-test";
import SuperAdmin from "@/pages/super-admin";
import UsersManagement from "@/pages/users-management";
import FirebaseAccountCheck from "@/pages/firebase-account-check";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

// Super Admin email check function (consistent with other places)
const isSuperAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  
  const superAdminEmails = [
    "drphaniraj1965@gmail.com",
    "doctornerves@gmail.com",
    "g.rajshaker@gmail.com"
  ];
  
  return superAdminEmails.includes(email);
};

// Protected route component that requires authentication
const ProtectedRoute = ({ component: Component, admin = false, superAdmin = false, ...rest }: { 
  component: React.ComponentType<any>;
  admin?: boolean;
  superAdmin?: boolean;
  path?: string;
}) => {
  const { user, isLoading, isAdmin } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect to root (which is now the login page) if not authenticated
    return <Redirect to="/" />;
  }

  // Special check for super admin pages
  if (superAdmin) {
    // Allow access only if user is in the superAdminEmails list OR has isAdmin flag
    const hasSuperAdminAccess = isSuperAdminEmail(user.email) || isAdmin;
    
    if (!hasSuperAdminAccess) {
      console.log("Super Admin access denied:", user.email);
      return <Redirect to="/dashboard" />;
    }
    
    console.log("Super Admin access granted for:", user.email);
    // Continue to the component if they have super admin access
  } 
  // Standard admin check for regular admin pages
  else if (admin && !isAdmin) {
    // Redirect to regular dashboard if trying to access admin page without admin rights
    return <Redirect to="/dashboard" />;
  }

  return <Component {...rest} />;
};

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={NewLogin} />
      <Route path="/welcome" component={Welcome} />
      <Route path="/login" component={NewLogin} />
      <Route path="/register" component={Register} />
      <Route path="/firebase-test" component={FirebaseTest} />
      <Route path="/firebase-account-check" component={FirebaseAccountCheck} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={UserDashboard} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} admin={true} />}
      </Route>
      <Route path="/ask-question">
        {() => <ProtectedRoute component={AskQuestion} />}
      </Route>
      <Route path="/my-questions">
        {() => <ProtectedRoute component={MyQuestions} />}
      </Route>
      <Route path="/super-admin">
        {() => <ProtectedRoute component={SuperAdmin} superAdmin={true} />}
      </Route>
      <Route path="/users-management">
        {() => <ProtectedRoute component={UsersManagement} superAdmin={true} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppRoutes />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
