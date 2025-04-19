import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser, fetchSignInMethodsForEmail } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { User, Shield, UserPlus, Loader2, UserCheck, AlertTriangle, RefreshCw, Trash2, Link as LinkIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/auth-context";
import { useLocation, Link } from "wouter";

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
  const [forceCreate, setForceCreate] = useState<boolean>(false);
  const { user, isAdmin } = useAuth();
  const [_, setLocation] = useLocation();

  // Grant super admin access based on both Firebase Auth UID and email
  React.useEffect(() => {
    const superAdminEmails = [
      "drphaniraj1965@gmail.com",
      "doctornerves@gmail.com",
      "g.rajshaker@gmail.com"
    ];
    
    // Allow access if the user is an admin OR has one of the super admin emails
    const isSuperAdmin = isAdmin || (user && user.email && superAdminEmails.includes(user.email));
    
    if (!user || !isSuperAdmin) {
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
  
  // Check if user already exists with given email and optionally delete documents
  const checkUserExists = async (email: string, deleteIfExists: boolean = false): Promise<boolean> => {
    try {
      let documentExists = false;
      let documentToDelete = null;
      let collectionName = "";

      // Check in users collection
      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("email", "==", email));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        documentExists = true;
        documentToDelete = userSnapshot.docs[0];
        collectionName = "users";
      }
      
      // Check in doctors collection
      if (!documentExists) {
        const doctorsRef = collection(db, "doctors");
        const doctorQuery = query(doctorsRef, where("email", "==", email));
        const doctorSnapshot = await getDocs(doctorQuery);
        
        if (!doctorSnapshot.empty) {
          documentExists = true;
          documentToDelete = doctorSnapshot.docs[0];
          collectionName = "doctors";
        }
      }

      // Also check in neurohealthhub collection
      if (!documentExists) {
        const neuroRef = collection(db, "neurohealthhub");
        const neuroQuery = query(neuroRef, where("email", "==", email));
        const neuroSnapshot = await getDocs(neuroQuery);
        
        if (!neuroSnapshot.empty) {
          documentExists = true;
          documentToDelete = neuroSnapshot.docs[0];
          collectionName = "neurohealthhub";
        }
      }
      
      // Delete the document if requested
      if (deleteIfExists && documentExists && documentToDelete) {
        await deleteDoc(doc(db, collectionName, documentToDelete.id));
        console.log(`Deleted existing document for ${email} from ${collectionName} collection`);
        return false; // Return false since we've deleted it
      }
      
      return documentExists;
    } catch (error) {
      console.error("Error checking existing user:", error);
      return false;
    }
  };
  
  // Helper function to check if a user exists in Firebase Auth by email
  const checkFirebaseUserExists = async (email: string): Promise<boolean> => {
    try {
      const auth = getAuth();
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return methods.length > 0;
    } catch (error) {
      console.error("Error checking Firebase user:", error);
      return false;
    }
  };
  
  // Helper function to delete user from Firebase Auth (if they exist)
  const deleteFirebaseUser = async (email: string): Promise<boolean> => {
    try {
      const auth = getAuth();
      
      // Current user can't delete themselves
      if (user?.email === email) {
        console.warn("Can't delete the currently logged in user");
        return false;
      }
      
      // Try to sign in as this user to get their credential
      try {
        // Save current signed in user
        const currentUser = auth.currentUser;
        
        // Sign in with the email we want to delete
        await signInWithEmailAndPassword(auth, email, formData.password);
        
        // If successful, we can delete this user
        if (auth.currentUser) {
          await deleteUser(auth.currentUser);
          console.log(`Deleted Firebase user with email: ${email}`);
          
          // Sign back in as the original user
          if (currentUser) {
            // We need to use your actual authentication mechanism here
            // This is just a placeholder since we can't know how your user authenticates
            // You may need to adjust this based on your app's actual auth flow
            await auth.updateCurrentUser(currentUser);
          }
          
          return true;
        }
      } catch (error) {
        console.warn(`Could not sign in as ${email} to delete: ${error}`);
        // This is expected if the user doesn't exist or password is incorrect
      }
      
      return false;
    } catch (error) {
      console.error("Error deleting Firebase user:", error);
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
      const userExistsInFirestore = await checkUserExists(formData.email, forceCreate);
      const userExistsInAuth = await checkFirebaseUserExists(formData.email);
      
      if (userExistsInFirestore && !forceCreate) {
        setError("A user with this email already exists in the database. Check 'Force create' to replace.");
        setLoading(false);
        return;
      }
      
      // If force create is enabled and user exists in Firebase Auth, try to delete them
      if (forceCreate && userExistsInAuth) {
        try {
          // Note: this might fail if we can't authenticate as the user
          await deleteFirebaseUser(formData.email);
        } catch (error) {
          console.warn("Could not delete existing Firebase user:", error);
          // Continue anyway, we'll try to create a new one
        }
      }
      
      // Create the user in Firebase Authentication
      const auth = getAuth();
      let userCredential;
      
      try {
        userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      } catch (authError: any) {
        // If there's an error about the user already existing, and we want to force create,
        // we can try to sign in with the provided credentials and proceed
        if (authError.code === 'auth/email-already-in-use' && forceCreate) {
          try {
            console.log("User already exists in Firebase Auth, attempting to sign in");
            userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
          } catch (signInError) {
            console.error("Failed to sign in as existing user:", signInError);
            throw new Error("Could not sign in as existing user. The password may be incorrect.");
          }
        } else {
          throw authError;
        }
      }
      
      if (!userCredential) {
        throw new Error("Failed to get user credentials");
      }
      
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
      const actionType = forceCreate ? "recreated" : "created";
      setSuccess(`${userType === "doctor" ? "Doctor" : "User"} account ${actionType} successfully!`);
      
      // Reset form
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        mobile: "",
        isAdmin: false,
      });
      setForceCreate(false);
      
      // Sign out the created user (since we're creating as super admin)
      // But first ensure we're not signed in as ourselves
      if (auth.currentUser?.email !== user?.email) {
        auth.signOut();
      }
      
    } catch (error: any) {
      console.error("Error creating user:", error);
      setError(error.message || "Failed to create user. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Get super admin status using the same logic as in the useEffect hook
  const superAdminEmails = [
    "drphaniraj1965@gmail.com",
    "doctornerves@gmail.com",
    "g.rajshaker@gmail.com"
  ];
  
  console.log("Super Admin Page - Current user:", user?.email);
  console.log("Is admin flag value:", isAdmin);
  
  // Allow access if user is super admin by email or has isAdmin flag
  const isSuperAdmin = isAdmin || (user && user.email && superAdminEmails.includes(user.email));
  console.log("Is super admin?", isSuperAdmin);
  
  // Override for specific emails - always allow access
  if (user && user.email && superAdminEmails.includes(user.email)) {
    console.log("Super admin access granted by email override");
  }
  
  // If not super admin, don't render the page
  if (!user) {
    console.log("Access denied: No user logged in");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You must be logged in to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // If user is logged in but not super admin
  if (!isSuperAdmin) {
    console.log("Access denied: User is not super admin");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page.
            Current user: {user.email}
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
          <p className="text-muted-foreground mb-4">Create authenticated users and doctor accounts</p>
          
          <div className="flex gap-4 mb-8">
            <Link href="/users-management">
              <Button variant="outline">
                <User className="h-4 w-4 mr-2" />
                Manage Users & Doctors
              </Button>
            </Link>
          </div>
          
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
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox 
                      id="forceCreate" 
                      checked={forceCreate}
                      onCheckedChange={(checked) => setForceCreate(checked as boolean)}
                    />
                    <Label
                      htmlFor="forceCreate"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5 text-destructive" />
                      Force create (deletes existing records)
                    </Label>
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
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox 
                      id="forceCreateDoc" 
                      checked={forceCreate}
                      onCheckedChange={(checked) => setForceCreate(checked as boolean)}
                    />
                    <Label
                      htmlFor="forceCreateDoc"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5 text-destructive" />
                      Force create (deletes existing records)
                    </Label>
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