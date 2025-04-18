import { Route, Switch, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Welcome from "@/pages/welcome";
import UserDashboard from "@/pages/user-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import AskQuestion from "@/pages/ask-question";
import MyQuestions from "@/pages/my-questions";
import FirebaseTest from "@/pages/firebase-test";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

// Protected route component that requires authentication
const ProtectedRoute = ({ component: Component, admin = false, ...rest }: { 
  component: React.ComponentType<any>;
  admin?: boolean; 
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
    // Redirect to login if not authenticated
    return <Redirect to="/login" />;
  }

  if (admin && !isAdmin) {
    // Redirect to regular dashboard if trying to access admin page without admin rights
    return <Redirect to="/dashboard" />;
  }

  return <Component {...rest} />;
};

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/firebase-test" component={FirebaseTest} />
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
