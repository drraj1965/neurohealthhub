import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { collection, getDocs, doc, updateDoc, where, query, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
import { User, Shield, AlertTriangle, CheckCircle, RefreshCw, Filter, ArrowLeft } from "lucide-react";
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

const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [doctors, setDoctors] = useState<UserData[]>([]);
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
      // Fetch regular users
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        selected: false
      })) as UserData[];
      
      // Fetch doctors
      const doctorsRef = collection(db, "doctors");
      const doctorsSnapshot = await getDocs(doctorsRef);
      const doctorsData = doctorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        selected: false
      })) as UserData[];
      
      setUsers(usersData);
      setDoctors(doctorsData);
      console.log("Fetched users:", usersData.length);
      console.log("Fetched doctors:", doctorsData.length);
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
      // Process each selected user
      for (const user of selectedUsers) {
        console.log(`Processing promotion for user: ${user.email} (ID: ${user.id})`);
        
        try {
          // 1. Update the user document in users collection to set isAdmin to true
          console.log(`Updating user document in 'users' collection (ID: ${user.id})`);
          await updateDoc(doc(db, "users", user.id), {
            isAdmin: true,
            updatedAt: new Date()
          });
          console.log(`✓ User document updated successfully`);
          
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
          console.log(`✓ Doctor document created successfully (ID: ${user.id})`);
        } catch (userErr) {
          console.error(`Error processing user ${user.email}:`, userErr);
          // Continue with next user instead of failing the entire operation
        }
      }
      
      // Refresh the lists
      await fetchUsersAndDoctors();
      
      // Show success message
      setSuccess(`Successfully promoted ${selectedUsers.length} user(s) to doctors`);
      toast({
        title: "Users Promoted",
        description: `Successfully promoted ${selectedUsers.length} user(s) to doctors`,
      });
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
      // Process each selected doctor
      for (const doctor of selectedDoctors) {
        console.log(`Processing demotion for doctor: ${doctor.email} (ID: ${doctor.id})`);
        
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
            console.log(`✓ User document updated successfully`);
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
            console.log(`✓ User document created successfully`);
          }
          
          // 2. Update the doctor document in the doctors collection to maintain data consistency
          console.log(`Updating doctor document in 'doctors' collection (ID: ${doctor.id})`);
          await updateDoc(doc(db, "doctors", doctor.id), {
            isAdmin: false,
            updatedAt: new Date()
          });
          console.log(`✓ Doctor document updated successfully`);
          
        } catch (doctorErr) {
          console.error(`Error processing doctor ${doctor.email}:`, doctorErr);
          // Continue with next doctor instead of failing the entire operation
        }
      }
      
      // Refresh the lists
      await fetchUsersAndDoctors();
      
      // Show success message
      setSuccess(`Successfully demoted ${selectedDoctors.length} doctor(s) to regular users`);
      toast({
        title: "Doctors Demoted",
        description: `Successfully demoted ${selectedDoctors.length} doctor(s) to regular users`,
      });
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
          <TabsList className="mb-6 grid grid-cols-2 w-[400px]">
            <TabsTrigger value="users" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Regular Users
            </TabsTrigger>
            <TabsTrigger value="doctors" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Doctors
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
        </Tabs>
      </div>
    </>
  );
};

export default UsersManagementPage;