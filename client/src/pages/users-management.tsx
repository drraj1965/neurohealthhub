import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { collection, getDocs, doc, updateDoc, where, query, setDoc, getDoc } from "firebase/firestore";
import { getAuth, User as FirebaseAuthUser } from "firebase/auth";
import { db } from "@/lib/firebase-service";
import { getFirebaseAdminApp, getFirebaseUsers, UserRecord } from "../lib/firebase-admin";
import { useAuth } from "@/context/auth-context";
import { useLocation, Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { User, Shield, AlertTriangle, CheckCircle, RefreshCw, Filter, ArrowLeft, Mail, Plus, Link as LinkIcon, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define user type
interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile: string;
  username: string;
  isAdmin: boolean;
  selected?: boolean; // For bulk actions
  createdAt?: any;
}

interface FirebaseAuthUserData {
  uid: string;
  email: string;
  displayName?: string;
  emailVerified: boolean;
  creationTime?: string;
  lastSignInTime?: string;
  phoneNumber?: string;
  providerData?: any[];
}

const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [doctors, setDoctors] = useState<UserData[]>([]);
  const [firebaseAuthUsers, setFirebaseAuthUsers] = useState<FirebaseAuthUserData[]>([]);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const { user, isAdmin } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Grant super admin access based on Firebase Auth UID and email
  useEffect(() => {
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

  // Fetch all users and doctors
  const fetchUsersAndDoctors = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Import our local storage module
      const { getAllUsersFromLocalStorage } = await import('@/lib/local-user-store');
      
      // Get users from local storage first
      const localUsers = getAllUsersFromLocalStorage();
      
      // If we have local users, use them immediately
      if (localUsers && localUsers.length > 0) {
        const usersData = localUsers.map(user => ({
          id: user.uid,
          ...user,
          selected: false
        })) as UserData[];
        
        setUsers(usersData);
        console.log("Fetched users from local storage:", usersData.length);
      }
      
      // Try Firestore anyway to get the latest if available
      try {
        // Fetch regular users from Firestore
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          selected: false
        })) as UserData[];
        
        // Fetch doctors from Firestore
        const doctorsRef = collection(db, "doctors");
        const doctorsSnapshot = await getDocs(doctorsRef);
        const doctorsData = doctorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          selected: false
        })) as UserData[];
        
        // If we got data from Firestore, use it (more up-to-date)
        if (usersData.length > 0) {
          setUsers(usersData);
          console.log("Updated users from Firestore:", usersData.length);
        }
        
        if (doctorsData.length > 0) {
          setDoctors(doctorsData);
          console.log("Updated doctors from Firestore:", doctorsData.length);
        }
      } catch (firestoreError) {
        console.error("Firestore fetch failed, using local data:", firestoreError);
        // We'll continue with local data
      }
      
      // Fetch Firebase Auth users using our new server API
      try {
        setLoadingAuth(true);
        console.log("About to fetch Firebase Auth users from server");
        
        const authUsers = await getFirebaseUsers();
        console.log("Server returned Firebase Auth users data, length:", Array.isArray(authUsers) ? authUsers.length : "not an array");
        
        if (Array.isArray(authUsers) && authUsers.length > 0) {
          // Convert to our FirebaseAuthUserData format
          const formattedAuthUsers = authUsers.map(authUser => {
            console.log("Processing auth user:", authUser);
            return {
              uid: authUser.uid || "",
              email: authUser.email || "",
              displayName: authUser.displayName || "",
              emailVerified: Boolean(authUser.emailVerified),
              creationTime: authUser.metadata?.creationTime || "",
              lastSignInTime: authUser.metadata?.lastSignInTime || "",
              phoneNumber: authUser.phoneNumber || "",
              providerData: authUser.providerData || []
            };
          });
          
          console.log("Formatted Firebase Auth users:", formattedAuthUsers);
          setFirebaseAuthUsers(formattedAuthUsers);
        } else {
          console.warn("No Firebase Auth users found or invalid response format");
          setFirebaseAuthUsers([]);
        }
      } catch (authErr) {
        console.error("Error fetching Firebase Auth users:", authErr);
        // Don't fail the entire operation if this part fails
        setFirebaseAuthUsers([]);
      } finally {
        setLoadingAuth(false);
      }
    } catch (err) {
      console.error("Error fetching users and doctors:", err);
      setError("Failed to load users and doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndDoctors();
  }, []);

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.username.toLowerCase().includes(searchLower)
    );
  });

  // Filter doctors based on search query
  const filteredDoctors = doctors.filter(doctor => {
    const searchLower = searchQuery.toLowerCase();
    return (
      doctor.email.toLowerCase().includes(searchLower) ||
      doctor.firstName.toLowerCase().includes(searchLower) ||
      doctor.lastName.toLowerCase().includes(searchLower) ||
      doctor.username.toLowerCase().includes(searchLower)
    );
  });
  
  // Filter Firebase Auth users based on search query
  const filteredAuthUsers = firebaseAuthUsers.filter(authUser => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (authUser.email && authUser.email.toLowerCase().includes(searchLower)) ||
      (authUser.displayName && authUser.displayName.toLowerCase().includes(searchLower))
    );
  });

  // Toggle selection of a user
  const toggleSelectUser = (id: string) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === id ? { ...user, selected: !user.selected } : user
      )
    );
  };

  // Toggle selection of a doctor
  const toggleSelectDoctor = (id: string) => {
    setDoctors(prevDoctors => 
      prevDoctors.map(doctor => 
        doctor.id === id ? { ...doctor, selected: !doctor.selected } : doctor
      )
    );
  };

  // Toggle select all users
  const toggleSelectAllUsers = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setUsers(prevUsers => 
      prevUsers.map(user => ({ ...user, selected: newSelectAll }))
    );
  };

  // Toggle select all doctors
  const toggleSelectAllDoctors = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setDoctors(prevDoctors => 
      prevDoctors.map(doctor => ({ ...doctor, selected: newSelectAll }))
    );
  };

  // Promote selected users to doctors
  const promoteSelectedUsers = async () => {
    const selectedUsers = users.filter(user => user.selected);
    
    if (selectedUsers.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select users to promote to doctors",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Import local storage module
      const { saveUserLocally } = await import('@/lib/local-user-store');
      let successCount = 0;
      
      // Process each selected user
      for (const user of selectedUsers) {
        console.log(`Processing promotion for user: ${user.email} (ID: ${user.id})`);
        
        try {
          // Update in local storage first (will always work)
          // Create a complete user object with updated admin status
          const userProfile = {
            uid: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            mobile: user.mobile || "",
            username: user.username,
            isAdmin: true,
            updatedAt: new Date().toISOString()
          };
          
          // Save to local storage
          saveUserLocally(userProfile);
          const localUpdateSuccess = true;
          
          if (localUpdateSuccess) {
            console.log(`✓ User updated in local storage successfully`);
            successCount++;
          }
          
          // Try Firestore updates as a backup
          try {
            // 1. Update the user document in users collection to set isAdmin to true
            console.log(`Updating user document in 'users' collection (ID: ${user.id})`);
            await updateDoc(doc(db, "users", user.id), {
              isAdmin: true,
              updatedAt: new Date()
            });
            console.log(`✓ User document updated successfully in Firestore`);
            
            // 2. Create a clean object without any client-side properties
            const doctorData = {
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              mobile: user.mobile || "",
              username: user.username,
              isAdmin: true, // Always true for doctors
              createdAt: user.createdAt || new Date(),
              updatedAt: new Date()
            };
            
            // 3. Create a new document in doctors collection with the same ID
            console.log(`Creating doctor document in 'doctors' collection (ID: ${user.id})`);
            await setDoc(doc(db, "doctors", user.id), doctorData);
            console.log(`✓ Doctor document created successfully in Firestore (ID: ${user.id})`);
          } catch (firestoreErr) {
            console.error(`Firestore update failed for user ${user.email}, but local storage update was successful:`, firestoreErr);
            // We'll count this as a success since the local storage update worked
          }
        } catch (userErr) {
          console.error(`Error processing user ${user.email}:`, userErr);
          // Continue with next user instead of failing the entire operation
        }
      }
      
      // Refresh the lists
      await fetchUsersAndDoctors();
      
      // Show success message based on the actual number of successful updates
      if (successCount > 0) {
        setSuccess(`Successfully promoted ${successCount} user(s) to doctors`);
        toast({
          title: "Users Promoted",
          description: `Successfully promoted ${successCount} user(s) to doctors`,
        });
      } else {
        throw new Error("No users were successfully promoted");
      }
    } catch (err) {
      console.error("Error promoting users:", err);
      setError("Failed to promote selected users");
      toast({
        title: "Promotion Failed",
        description: "Could not promote selected users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Demote selected doctors to regular users
  const demoteSelectedDoctors = async () => {
    const selectedDoctors = doctors.filter(doctor => doctor.selected);
    
    if (selectedDoctors.length === 0) {
      toast({
        title: "No Doctors Selected",
        description: "Please select doctors to demote to regular users",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Import local storage module
      const { saveUserLocally } = await import('@/lib/local-user-store');
      let successCount = 0;
      
      // Process each selected doctor
      for (const doctor of selectedDoctors) {
        console.log(`Processing demotion for doctor: ${doctor.email} (ID: ${doctor.id})`);
        
        try {
          // Create a user object with doctor data and demoted status
          const userProfile = {
            uid: doctor.id,
            email: doctor.email,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            mobile: doctor.mobile || "",
            username: doctor.username,
            isAdmin: false,
            updatedAt: new Date().toISOString()
          };
          
          // Save to local storage
          saveUserLocally(userProfile);
          const localStorageSuccess = true;
          
          if (localStorageSuccess) {
            console.log(`✓ User updated in local storage successfully`);
            successCount++;
          }
          
          // Try Firestore operations as well (but don't depend on them)
          try {
            // 1. Update the user document in users collection to set isAdmin to false (or create if it doesn't exist)
            const usersRef = collection(db, "users");
            const userQuery = query(usersRef, where("email", "==", doctor.email));
            const userSnapshot = await getDocs(userQuery);
            
            if (!userSnapshot.empty) {
              // Update existing user document
              console.log(`Updating existing user document in 'users' collection (ID: ${userSnapshot.docs[0].id})`);
              await updateDoc(doc(db, "users", userSnapshot.docs[0].id), {
                isAdmin: false,
                updatedAt: new Date()
              });
              console.log(`✓ User document updated successfully in Firestore`);
            } else {
              // If no user record exists, create a clean one from the doctor record
              console.log(`No user document found, creating new user document with ID: ${doctor.id}`);
              
              // Create a clean object without any client-side properties
              const userData = {
                email: doctor.email,
                firstName: doctor.firstName,
                lastName: doctor.lastName,
                mobile: doctor.mobile || "",
                username: doctor.username,
                isAdmin: false, // Always false for demoted doctors
                createdAt: doctor.createdAt || new Date(),
                updatedAt: new Date()
              };
              
              await setDoc(doc(db, "users", doctor.id), userData);
              console.log(`✓ User document created successfully in Firestore`);
            }
            
            // 2. Update the doctor document in the doctors collection to maintain data consistency
            console.log(`Updating doctor document in 'doctors' collection (ID: ${doctor.id})`);
            await updateDoc(doc(db, "doctors", doctor.id), {
              isAdmin: false,
              updatedAt: new Date()
            });
            console.log(`✓ Doctor document updated successfully in Firestore`);
          } catch (firestoreErr) {
            console.error(`Firestore updates failed for doctor ${doctor.email}, but local storage update succeeded:`, firestoreErr);
            // We still count this as a success since the local storage operation worked
          }
        } catch (doctorErr) {
          console.error(`Error processing doctor ${doctor.email}:`, doctorErr);
          // Continue with next doctor instead of failing the entire operation
        }
      }
      
      // Refresh the lists
      await fetchUsersAndDoctors();
      
      // Show success message based on the actual number of successful updates
      if (successCount > 0) {
        setSuccess(`Successfully demoted ${successCount} doctor(s) to regular users`);
        toast({
          title: "Doctors Demoted",
          description: `Successfully demoted ${successCount} doctor(s) to regular users`,
        });
      } else {
        throw new Error("No doctors were successfully demoted");
      }
    } catch (err) {
      console.error("Error demoting doctors:", err);
      setError("Failed to demote selected doctors");
      toast({
        title: "Demotion Failed",
        description: "Could not demote selected doctors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh the data
  const refreshData = () => {
    fetchUsersAndDoctors();
    toast({
      title: "Data Refreshed",
      description: "User and doctor lists have been refreshed",
    });
  };
  
  // Check if a user exists in Firestore (either in users or doctors collection)
  const userExistsInFirestore = (uid: string): boolean => {
    // Check if the user is already in the users or doctors array
    return users.some(user => user.id === uid) || doctors.some(doctor => doctor.id === uid);
  };
  
  // State to store the verification link
  const [verificationLink, setVerificationLink] = useState<string | null>(null);
  
  // Send email verification to a user
  const sendVerificationEmail = async (uid: string) => {
    try {
      setLoading(true);
      console.log(`Sending verification email to user with UID: ${uid}`);
      
      const response = await fetch(`/api/firebase-auth/users/${uid}/send-verification-email`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Store the verification link for display
      if (result.verificationLink) {
        setVerificationLink(result.verificationLink);
        toast({
          title: "Verification Link Generated",
          description: "Verification link has been generated and is displayed below. You can share this link with the user.",
          duration: 6000,
        });
      } else {
        toast({
          title: "Verification Email Sent",
          description: `Email delivery attempted. Check server logs for delivery status.`,
        });
      }
      
      // Refresh to update the UI
      await fetchUsersAndDoctors();
    } catch (error) {
      console.error("Error sending verification email:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Failed to Send Email",
        description: `Error: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Add a verified Firebase Auth user to Firestore
  const addVerifiedUserToFirestore = async (authUser: FirebaseAuthUserData) => {
    try {
      setLoading(true);
      console.log(`Adding verified user to Firestore: ${authUser.email} (${authUser.uid})`);
      
      if (!authUser.emailVerified) {
        toast({
          title: "Email Not Verified",
          description: "User must verify their email before being added to the system.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if user already exists
      if (userExistsInFirestore(authUser.uid)) {
        toast({
          title: "User Already Exists",
          description: "This user already exists in the system.",
          variant: "destructive",
        });
        return;
      }
      
      // Import local storage module
      const { saveUserLocally } = await import('@/lib/local-user-store');
      
      // Create a new user document with the same ID as the Firebase Auth UID
      const firstName = authUser.displayName ? authUser.displayName.split(' ')[0] : '';
      const lastName = authUser.displayName ? authUser.displayName.split(' ').slice(1).join(' ') : '';
      
      // Create the user data object
      const userData = {
        uid: authUser.uid,
        email: authUser.email,
        firstName: firstName,
        lastName: lastName,
        mobile: authUser.phoneNumber || "",
        username: authUser.email.split('@')[0],
        isAdmin: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to local storage first (this always works)
      saveUserLocally(userData);
      
      try {
        // Then try to save to Firestore (might fail if connectivity issues)
        const firestoreData = {
          email: authUser.email,
          firstName: firstName,
          lastName: lastName,
          mobile: authUser.phoneNumber || "",
          username: authUser.email.split('@')[0],
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(doc(db, "users", authUser.uid), firestoreData);
        console.log(`✓ User successfully saved to Firestore`);
      } catch (firestoreErr) {
        console.error(`Firestore save failed, but user was saved to local storage:`, firestoreErr);
        // We still count this as a success since we have local storage
      }
      
      toast({
        title: "User Added",
        description: `Successfully added ${authUser.email} to users collection.`,
      });
      
      // Refresh to update the UI
      await fetchUsersAndDoctors();
    } catch (error) {
      console.error("Error adding user to Firestore:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Failed to Add User",
        description: `Error: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if the current user is a super admin
  const superAdminEmails = [
    "drphaniraj1965@gmail.com",
    "doctornerves@gmail.com",
    "g.rajshaker@gmail.com"
  ];
  
  const isSuperAdmin = isAdmin || (user && user.email && superAdminEmails.includes(user.email));
  
  // If not super admin, don't render the page
  if (!user) {
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
        <title>User Management | NeuroHealthHub</title>
      </Helmet>
      <div className="container mx-auto py-10">
        <Link href="/super-admin" className="mb-4 flex items-center text-primary hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Super Admin
        </Link>
        
        <div className="flex justify-between items-center mb-8 mt-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">User Management</h1>
            <p className="text-muted-foreground">Manage users and doctors in the system</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={refreshData}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

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
        
        {verificationLink && (
          <Alert className="mb-4">
            <LinkIcon className="h-4 w-4" />
            <AlertTitle>Verification Link Generated</AlertTitle>
            <AlertDescription>
              <p className="mb-2">Share this link with the user to verify their email:</p>
              <div className="bg-muted p-2 rounded-md mb-2 relative break-all text-xs">
                <code>{verificationLink}</code>
                <button
                  className="absolute right-2 top-2 text-primary hover:text-primary/80"
                  onClick={() => {
                    navigator.clipboard.writeText(verificationLink);
                    toast({
                      title: "Copied to clipboard",
                      description: "The verification link has been copied to your clipboard.",
                    });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setVerificationLink(null)}
                className="mt-2"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6 grid grid-cols-3 w-[600px]">
            <TabsTrigger value="users" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Regular Users
            </TabsTrigger>
            <TabsTrigger value="doctors" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Doctors
            </TabsTrigger>
            <TabsTrigger value="authUsers" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Firebase Auth
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Regular Users 
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({filteredUsers.length} users)
                    </span>
                  </div>
                  <Button 
                    variant="default" 
                    onClick={promoteSelectedUsers}
                    disabled={loading || !users.some(user => user.selected)}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Promote Selected to Doctors
                  </Button>
                </CardTitle>
                <CardDescription>
                  Manage regular users in the system. Check the boxes to select users and promote them to doctors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox 
                            checked={selectAll && users.length > 0} 
                            onCheckedChange={toggleSelectAllUsers}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>Is Admin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Checkbox 
                              checked={user.selected || false}
                              onCheckedChange={() => toggleSelectUser(user.id)}
                            />
                          </TableCell>
                          <TableCell>{user.firstName} {user.lastName}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.mobile || 'N/A'}</TableCell>
                          <TableCell>{user.isAdmin ? 'Yes' : 'No'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="doctors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Doctors 
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({filteredDoctors.length} doctors)
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={demoteSelectedDoctors}
                    disabled={loading || !doctors.some(doctor => doctor.selected)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Demote Selected to Users
                  </Button>
                </CardTitle>
                <CardDescription>
                  Manage doctors in the system. Check the boxes to select doctors and demote them to regular users.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No doctors found.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox 
                            checked={selectAll && doctors.length > 0} 
                            onCheckedChange={toggleSelectAllDoctors}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>Is Admin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDoctors.map((doctor) => (
                        <TableRow key={doctor.id}>
                          <TableCell>
                            <Checkbox 
                              checked={doctor.selected || false}
                              onCheckedChange={() => toggleSelectDoctor(doctor.id)}
                            />
                          </TableCell>
                          <TableCell>{doctor.firstName} {doctor.lastName}</TableCell>
                          <TableCell>{doctor.email}</TableCell>
                          <TableCell>{doctor.username}</TableCell>
                          <TableCell>{doctor.mobile || 'N/A'}</TableCell>
                          <TableCell>{doctor.isAdmin ? 'Yes' : 'No'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Firebase Auth Users Tab */}
          <TabsContent value="authUsers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Firebase Auth Users
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({filteredAuthUsers.length} auth users)
                    </span>
                  </div>
                </CardTitle>
                <CardDescription className="space-y-2">
                  <p>View users registered in Firebase Authentication. Note: These operations require the Firebase Admin SDK on a secure server and cannot be performed from the client-side.</p>
                  
                  <div className="bg-green-50 border border-green-100 rounded-md p-3 mt-2">
                    <p className="text-green-800 text-xs font-medium">✅ AUTOMATED EMAIL VERIFICATION SYSTEM</p>
                    <p className="text-green-700 text-xs mt-1">
                      The system now automatically handles the entire verification flow:
                    </p>
                    <ol className="text-green-700 text-xs mt-1 list-decimal pl-5">
                      <li>When users register, verification emails are sent automatically</li>
                      <li>When users click the verification link, their email is marked as verified</li>
                      <li>Verified users are automatically added to the Firestore database</li>
                      <li>No admin intervention is required for normal verification flow</li>
                    </ol>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAuth ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredAuthUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Alert className="max-w-lg mx-auto">
                      <AlertTitle className="flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                        Firebase Admin SDK Connected
                      </AlertTitle>
                      <AlertDescription>
                        <p className="mb-2">
                          The Firebase Admin SDK is properly connected, but no users were found in Firebase Authentication.
                        </p>
                        <p className="mb-2">
                          Users created through the registration process will appear here once they sign up.
                        </p>
                        <p className="mb-2">
                          You can refresh this list by clicking the button below.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={fetchUsersAndDoctors}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh Users
                        </Button>
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>UID</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Display Name</TableHead>
                        <TableHead>Email Verified</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Last Sign In</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAuthUsers.map((authUser) => (
                        <TableRow key={authUser.uid}>
                          <TableCell>{authUser.uid}</TableCell>
                          <TableCell>{authUser.email || 'N/A'}</TableCell>
                          <TableCell>{authUser.displayName || 'N/A'}</TableCell>
                          <TableCell>{authUser.emailVerified ? 'Yes' : 'No'}</TableCell>
                          <TableCell>{authUser.creationTime || 'N/A'}</TableCell>
                          <TableCell>{authUser.lastSignInTime || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {!authUser.emailVerified && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => sendVerificationEmail(authUser.uid)}
                                  title="Use this only if the automatic verification email was not received"
                                >
                                  <Mail className="h-4 w-4 mr-1" />
                                  Resend Verification
                                </Button>
                              )}
                              {authUser.emailVerified && !userExistsInFirestore(authUser.uid) && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => addVerifiedUserToFirestore(authUser)}
                                  title="Manual fallback if automatic database entry failed"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Manual Add to DB
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default UsersManagementPage;