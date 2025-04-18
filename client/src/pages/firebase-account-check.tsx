import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { getAuth, signOut, fetchSignInMethodsForEmail, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertTriangle, CheckCircle, User, UserPlus, Shield, UserCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";

const FirebaseAccountCheckPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailToCheck, setEmailToCheck] = useState("doctornerves@gmail.com");
  const [password, setPassword] = useState("Doctor@123");
  const [firstName, setFirstName] = useState("Doctor");
  const [lastName, setLastName] = useState("Nerves");
  
  const checkAccount = async () => {
    setIsLoading(true);
    setResults([]);
    setError(null);
    setSuccess(null);
    
    try {
      const auth = getAuth();
      const db = getFirestore();
      
      // Check if the email exists in Firebase Authentication
      const signInMethods = await fetchSignInMethodsForEmail(auth, emailToCheck);
      
      if (signInMethods.length > 0) {
        setResults(prev => [...prev, `✅ Email ${emailToCheck} exists in Firebase Authentication`]);
        setResults(prev => [...prev, `Sign-in methods: ${signInMethods.join(", ")}`]);
      } else {
        setResults(prev => [...prev, `❌ Email ${emailToCheck} does NOT exist in Firebase Authentication`]);
      }
      
      // Also show current authentication state
      if (auth.currentUser && auth.currentUser.email) {
        setResults(prev => [...prev, `🔑 Currently authenticated as: ${auth.currentUser.email}`]);
        setResults(prev => [...prev, `UID: ${auth.currentUser.uid || 'No UID available'}`]);
      } else {
        setResults(prev => [...prev, `🔒 Not currently authenticated with Firebase`]);
      }
      
    } catch (error: any) {
      console.error("Error checking account:", error);
      setError(`Error checking account: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const createSuperAdminAccount = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const auth = getAuth();
      const db = getFirestore();
      
      // First check if the account already exists
      const signInMethods = await fetchSignInMethodsForEmail(auth, emailToCheck);
      
      if (signInMethods.length > 0) {
        setError(`Account with email ${emailToCheck} already exists. Cannot create duplicate.`);
        setIsLoading(false);
        return;
      }
      
      // Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        emailToCheck, 
        password
      );
      
      const uid = userCredential.user.uid;
      
      // Force token refresh to ensure tokens are valid before any Firestore operations
      await userCredential.user.getIdToken(true);
      
      // Create user document in Firestore
      await setDoc(doc(db, "doctors", uid), {
        email: emailToCheck,
        firstName: firstName,
        lastName: lastName,
        mobile: "",
        isAdmin: true,
        username: `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
        createdAt: new Date()
      });
      
      setSuccess(`Successfully created super admin account: ${emailToCheck}`);
      
      // Sign out so we can test logging in with the new account
      await signOut(auth);
      
    } catch (error: any) {
      console.error("Error creating account:", error);
      setError(`Error creating account: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Firebase Account Check | NeuroHealthHub</title>
      </Helmet>
      <div className="container mx-auto py-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-2">Firebase Account Check</h1>
          <p className="text-muted-foreground mb-8">Check and create Firebase accounts</p>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Check Email in Firebase
              </CardTitle>
              <CardDescription>
                Verify if an email exists in Firebase Authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-green-700">Success!</AlertTitle>
                  <AlertDescription className="text-green-600">{success}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="emailToCheck">Email Address</Label>
                <Input 
                  id="emailToCheck" 
                  type="email"
                  value={emailToCheck}
                  onChange={(e) => setEmailToCheck(e.target.value)}
                  placeholder="Email to check"
                />
              </div>
              
              <Button 
                className="w-full mt-4" 
                onClick={checkAccount}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Check Account
                  </>
                )}
              </Button>
              
              {results.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h3 className="font-semibold mb-2">Results:</h3>
                  <ul className="space-y-2 text-sm">
                    {results.map((result, index) => (
                      <li key={index}>{result}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="mr-2 h-5 w-5" />
                Create Super Admin Account
              </CardTitle>
              <CardDescription>
                Create a super admin account in Firebase (doctornerves@gmail.com)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={emailToCheck}
                  onChange={(e) => setEmailToCheck(e.target.value)}
                  placeholder="Email address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (minimum 6 characters)"
                />
              </div>
              
              <Button 
                className="w-full mt-4" 
                onClick={createSuperAdminAccount}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Super Admin Account
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default FirebaseAccountCheckPage;