import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { User, Shield, UserPlus, Loader2, UserCheck, AlertTriangle, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { useLocation } from "wouter";

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  mobile: string;
  isAdmin: boolean;
}

const SuperAdminPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    mobile: "",
    isAdmin: false,
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>("user");
  const { user, isAdmin } = useAuth();
  const [_, setLocation] = useLocation();

  // Redirect if not super admin (check based on Firebase UID)
  // For now we will use isAdmin for testing, but you should replace with a more specific check
  React.useEffect(() => {
    // Super admin check could be more sophisticated, like checking a specific UID or role
    if (!user || !isAdmin) {
      setLocation("/");
    }
  }, [user, isAdmin, setLocation]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const validateForm = (): boolean => {
    if (!formData.email || !formData.email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }
    
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    
    if (!formData.firstName || !formData.firstName.trim()) {
      setError("First name is required");
      return false;
    }
    
    if (!formData.lastName || !formData.lastName.trim()) {
      setError("Last name is required");
      return false;
    }
    
    return true;
  };
  
  // Check if user already exists with given email
  const checkUserExists = async (email: string): Promise<boolean> => {
    try {
      // Check in users collection
      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("email", "==", email));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        return true;
      }
      
      // Check in doctors collection
      const doctorsRef = collection(db, "doctors");
      const doctorQuery = query(doctorsRef, where("email", "==", email));
      const doctorSnapshot = await getDocs(doctorQuery);
      
      return !doctorSnapshot.empty;
    } catch (error) {
      console.error("Error checking existing user:", error);
      return false;
    }
  };
  
  const createUser = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // First check if user already exists in Firestore
      const userExists = await checkUserExists(formData.email);
      if (userExists) {
        setError("A user with this email already exists in the database");
        setLoading(false);
        return;
      }
      
      // Create the user in Firebase Authentication
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = userCredential.user.uid;
      
      // Force token refresh
      await userCredential.user.getIdToken(true);
      
      // Determine collection based on user type
      const collectionName = userType === "doctor" ? "doctors" : "users";
      
      // Create user document in Firestore
      await setDoc(doc(db, collectionName, uid), {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        mobile: formData.mobile || "",
        isAdmin: userType === "doctor", // Doctors are admins
        username: `${formData.firstName.toLowerCase()}${formData.lastName.toLowerCase()}`,
        createdAt: new Date()
      });
      
      // Show success message
      setSuccess(`${userType === "doctor" ? "Doctor" : "User"} account created successfully!`);
      
      // Reset form
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        mobile: "",
        isAdmin: false,
      });
      
      // Sign out the created user (since we're creating as super admin)
      auth.signOut();
      
    } catch (error: any) {
      console.error("Error creating user:", error);
      setError(error.message || "Failed to create user. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // If not super admin, don't render the page
  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Super Admin | NeuroHealthHub</title>
      </Helmet>
      <div className="container mx-auto py-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-2">Super Admin Panel</h1>
          <p className="text-muted-foreground mb-8">Create authenticated users and doctor accounts</p>
          
          <Tabs defaultValue="createUser" className="mb-8">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="createUser">Create Regular User</TabsTrigger>
              <TabsTrigger value="createDoctor">Create Doctor (Admin)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="createUser">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Create User Account
                  </CardTitle>
                  <CardDescription>
                    Create a new authenticated user account linked to Firestore
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
                      <UserCheck className="h-4 w-4 text-green-500" />
                      <AlertTitle className="text-green-700">Success!</AlertTitle>
                      <AlertDescription className="text-green-600">{success}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="First name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="user@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number (Optional)</Label>
                    <Input 
                      id="mobile" 
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="Mobile number"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setUserType("user");
                      createUser();
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    Create User Account
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="createDoctor">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5" />
                    Create Doctor Account (Admin)
                  </CardTitle>
                  <CardDescription>
                    Create a new authenticated doctor account with admin privileges
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
                      <UserCheck className="h-4 w-4 text-green-500" />
                      <AlertTitle className="text-green-700">Success!</AlertTitle>
                      <AlertDescription className="text-green-600">{success}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstNameDoc">First Name</Label>
                      <Input 
                        id="firstNameDoc" 
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="First name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastNameDoc">Last Name</Label>
                      <Input 
                        id="lastNameDoc" 
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emailDoc">Email Address</Label>
                    <Input 
                      id="emailDoc" 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="doctor@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="passwordDoc">Password</Label>
                    <Input 
                      id="passwordDoc" 
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mobileDoc">Mobile Number (Optional)</Label>
                    <Input 
                      id="mobileDoc" 
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="Mobile number"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setUserType("doctor");
                      createUser();
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Shield className="mr-2 h-4 w-4" />
                    )}
                    Create Doctor Account
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="mr-2 h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Refresh and verify database entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                All created accounts will have their authentication properly linked with database entries.
                This ensures that security rules work correctly and data can be accessed by the appropriate users.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Verify User Accounts
                </Button>
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Verify Doctor Accounts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SuperAdminPage;