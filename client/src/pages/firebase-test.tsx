import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { 
  collection, 
  getDocs, 
  query, 
  collectionGroup,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  enableIndexedDbPersistence,
  where
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { Loader2, Database, RefreshCw, InfoIcon, FileWarning, Shield, LogIn, UserPlus, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Collection {
  id: string;
  path: string;
  documentCount: number;
}

interface Document {
  id: string;
  path: string;
  data: any;
}

const FirebaseTest: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  
  // Authentication state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [foundUserData, setFoundUserData] = useState<{collection: string, docId: string} | null>(null);

  useEffect(() => {
    // Get project ID from environment
    setProjectId(import.meta.env.VITE_FIREBASE_PROJECT_ID);
    
    // Enable persistence for better offline support
    try {
      enableIndexedDbPersistence(db)
        .then(() => {
          console.log("Offline persistence enabled");
        })
        .catch((err) => {
          console.warn("Persistence error:", err);
        });
    } catch (err) {
      // Already enabled or not supported
    }
  }, []);

  // Helper function to fetch all collections and subcollections
  const fetchCollections = async () => {
    // Get current authentication state to confirm user is logged in
    const currentUser = getAuth().currentUser;
    
    if (!currentUser && !import.meta.env.DEV) {
      setError("You must be logged in to access Firebase data. Please log in first.");
      console.log("No authenticated user found. Auth state:", getAuth().currentUser);
      return;
    }
    
    if (currentUser) {
      console.log("Authenticated user found:", currentUser.uid, currentUser.email);
    }
    
    setLoading(true);
    setError(null);
    try {
      // Root level collections - Common collections in Firebase
      const rootCollections = [
        // Try collections at the root level
        "users", "doctors", "questions", "answers",
        // Try collections with neurohealthhub as a top-level collection itself
        "neurohealthhub"
      ];
      const collectionsData: Collection[] = [];

      for (const collectionName of rootCollections) {
        try {
          const collectionRef = collection(db, collectionName);
          const querySnapshot = await getDocs(query(collectionRef));
          
          collectionsData.push({
            id: collectionName,
            path: collectionName,
            documentCount: querySnapshot.size
          });

          // Check for subcollections in each document - only check first 5 docs to avoid too many requests
          const docsToCheck = querySnapshot.docs.slice(0, 5);
          for (const docSnapshot of docsToCheck) {
            try {
              // Common subcollections we expect
              const subCollectionNames = ["my_questions", "user_questions", "answers"];
              
              for (const subCollectionName of subCollectionNames) {
                try {
                  const subCollectionRef = collection(db, collectionName, docSnapshot.id, subCollectionName);
                  const subQuerySnapshot = await getDocs(query(subCollectionRef));
                  
                  if (subQuerySnapshot.size > 0) {
                    collectionsData.push({
                      id: `${collectionName}/${docSnapshot.id}/${subCollectionName}`,
                      path: `${collectionName}/${docSnapshot.id}/${subCollectionName}`,
                      documentCount: subQuerySnapshot.size
                    });
                  }
                } catch (subCollectionError) {
                  console.log(`No subcollection ${subCollectionName} for ${collectionName}/${docSnapshot.id}`);
                }
              }
            } catch (err) {
              console.log(`Error fetching subcollections for ${collectionName}/${docSnapshot.id}:`, err);
            }
          }
        } catch (err: any) {
          console.log(`Collection ${collectionName} might not exist or permission denied:`, err);
          if (err.code === 'permission-denied') {
            setError(`Permission denied accessing collection '${collectionName}'. Please check Firebase security rules.`);
          }
        }
      }

      setCollections(collectionsData);
      
      if (collectionsData.length === 0) {
        setError("No collections found. You may need to check your Firebase security rules or create initial data.");
      } else {
        setError(null);
      }
    } catch (err: any) {
      console.error("Error fetching collections:", err);
      if (err.code === 'permission-denied') {
        setError("Permission denied accessing Firebase. Make sure you set up proper Firebase security rules.");
      } else {
        setError(`Failed to fetch collections: ${err.message}. Check console for details.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch documents for a specific collection
  const fetchDocuments = async (collectionPath: string) => {
    // Get current authentication state to confirm user is logged in
    const currentUser = getAuth().currentUser;
    
    if (!currentUser && !import.meta.env.DEV) {
      setError("You must be logged in to access Firebase data. Please log in first.");
      console.log("No authenticated user found. Auth state:", getAuth().currentUser);
      return;
    }
    
    if (currentUser) {
      console.log("Authenticated user for document fetch:", currentUser.uid, currentUser.email);
    }
    
    setLoading(true);
    setError(null);
    setDocuments([]); // Clear previous documents
    
    try {
      console.log(`Fetching documents from collection: ${collectionPath}`);
      const pathSegments = collectionPath.split('/');
      
      // Create collection reference based on path segments
      let collectionRef;
      
      // For any path, we just pass all the segments correctly
      // This correctly handles paths like 'neurohealthhub' or 'users'
      // as well as subcollections like 'neurohealthhub/users' (which would be
      // a collection 'users' inside document 'neurohealthhub')
      console.log(`Creating collection reference from path: ${collectionPath}`);
      // Handle the path segments dynamically based on the number of segments
      if (pathSegments.length === 1) {
        collectionRef = collection(db, pathSegments[0]);
      } else if (pathSegments.length === 2) {
        collectionRef = collection(db, pathSegments[0], pathSegments[1]);
      } else if (pathSegments.length === 3) {
        collectionRef = collection(db, pathSegments[0], pathSegments[1], pathSegments[2]);
      } else {
        throw new Error(`Path has too many segments: ${collectionPath}`);
      }
      console.log(`Successfully created reference for ${collectionPath}`);
      
      // Add more detailed logging
      console.log(`Executing query on collection: ${collectionPath}`);
      const querySnapshot = await getDocs(query(collectionRef));
      console.log(`Retrieved ${querySnapshot.size} documents from ${collectionPath}`);
      
      // Process documents with better error handling
      const documentsData: Document[] = [];
      
      querySnapshot.forEach(doc => {
        try {
          const data = doc.data();
          console.log(`Document ID: ${doc.id}, data:`, data);
          documentsData.push({
            id: doc.id,
            path: `${collectionPath}/${doc.id}`,
            data: data
          });
        } catch (docError) {
          console.error(`Error processing document ${doc.id}:`, docError);
        }
      });
      
      setDocuments(documentsData);
      setSelectedCollection(collectionPath);
      setError(null);
      
      if (documentsData.length === 0) {
        setError("No documents found in this collection.");
      }
    } catch (err: any) {
      console.error(`Error fetching documents for ${collectionPath}:`, err);
      if (err.code === 'permission-denied') {
        setError(`Permission denied accessing collection '${collectionPath}'. Please check Firebase security rules.`);
      } else {
        setError(`Failed to fetch documents for ${collectionPath}: ${err.message}`);
      }
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "N/A";
    
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleString();
    }
    
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    
    return "Invalid timestamp";
  };
  
  // Function to check user data access in different collections
  const checkUserDataAccess = async (userId: string, userEmail: string) => {
    console.log("DEBUG: Checking user data access for UID:", userId, "Email:", userEmail);
    let foundInCollection = null;
    let documentId = null;
    
    try {
      // Step 1: Try with Firebase UID in users collection
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        console.log("DEBUG: User found in users collection with Firebase UID");
        foundInCollection = 'users (by UID)';
        documentId = userId;
        return { collection: foundInCollection, docId: documentId };
      }
      
      // Step 2: Try with Firebase UID in doctors collection
      const doctorDoc = await getDoc(doc(db, 'doctors', userId));
      if (doctorDoc.exists()) {
        console.log("DEBUG: User found in doctors collection with Firebase UID");
        foundInCollection = 'doctors (by UID)';
        documentId = userId;
        return { collection: foundInCollection, docId: documentId };
      }
      
      // Step 3: Try with Firebase UID in neurohealthhub collection
      const neuroDoc = await getDoc(doc(db, 'neurohealthhub', userId));
      if (neuroDoc.exists()) {
        console.log("DEBUG: User found in neurohealthhub collection with Firebase UID");
        foundInCollection = 'neurohealthhub (by UID)';
        documentId = userId;
        return { collection: foundInCollection, docId: documentId };
      }
      
      // Step 4: Try by email in users collection if we have an email
      if (userEmail) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          console.log("DEBUG: User found by email in users collection, document ID:", userDoc.id);
          foundInCollection = 'users (by email)';
          documentId = userDoc.id;
          return { collection: foundInCollection, docId: documentId, doc: userDoc };
        }
      }
      
      // Step 5: Try by email in doctors collection if we have an email
      if (userEmail) {
        const doctorsRef = collection(db, 'doctors');
        const q = query(doctorsRef, where('email', '==', userEmail));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doctorDoc = querySnapshot.docs[0];
          console.log("DEBUG: User found by email in doctors collection, document ID:", doctorDoc.id);
          foundInCollection = 'doctors (by email)';
          documentId = doctorDoc.id;
          return { collection: foundInCollection, docId: documentId, doc: doctorDoc };
        }
      }
      
      // Step 6: Try by email in neurohealthhub collection if we have an email
      if (userEmail) {
        const neuroRef = collection(db, 'neurohealthhub');
        const q = query(neuroRef, where('email', '==', userEmail));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const neuroDoc = querySnapshot.docs[0];
          console.log("DEBUG: User found by email in neurohealthhub collection, document ID:", neuroDoc.id);
          foundInCollection = 'neurohealthhub (by email)';
          documentId = neuroDoc.id;
          return { collection: foundInCollection, docId: documentId, doc: neuroDoc };
        }
      }
      
      console.log("DEBUG: User data not found in any collection by UID or email");
      return null;
      
    } catch (error) {
      console.error("DEBUG: Error checking user data access:", error);
      return null;
    } finally {
      if (foundInCollection && documentId) {
        console.log(`DEBUG: User data found in ${foundInCollection} with document ID: ${documentId}`);
      } else {
        console.log("DEBUG: User data not found in any collection");
      }
    }
  };
  
  // Function to migrate a user document to match Firebase Auth UID
  const migrateUserDocument = async (sourceCollection: string, oldDocId: string, targetUid: string) => {
    console.log(`DEBUG: Migrating user document from ${sourceCollection}/${oldDocId} to ${sourceCollection}/${targetUid}`);
    setIsAuthLoading(true);
    
    try {
      // 1. Get the user document with the old ID
      const oldDocRef = doc(db, sourceCollection, oldDocId);
      const oldDocSnapshot = await getDoc(oldDocRef);
      
      if (!oldDocSnapshot.exists()) {
        setError(`Original document not found at ${sourceCollection}/${oldDocId}`);
        return false;
      }
      
      // 2. Get the user data
      const userData = oldDocSnapshot.data();
      console.log("DEBUG: User data retrieved:", userData);
      
      // 3. Check if target document already exists
      const newDocRef = doc(db, sourceCollection, targetUid);
      const newDocSnapshot = await getDoc(newDocRef);
      
      if (newDocSnapshot.exists()) {
        setError(`Target document already exists at ${sourceCollection}/${targetUid}. Cannot overwrite existing data.`);
        return false;
      }
      
      // 4. Create a new document with the Firebase Auth UID
      await setDoc(newDocRef, userData);
      console.log(`DEBUG: New document created at ${sourceCollection}/${targetUid}`);
      
      // 5. Delete the old document
      await deleteDoc(oldDocRef);
      console.log(`DEBUG: Old document deleted from ${sourceCollection}/${oldDocId}`);
      
      alert(`Document successfully migrated from ${sourceCollection}/${oldDocId} to ${sourceCollection}/${targetUid}`);
      return true;
    } catch (error) {
      console.error("DEBUG: Error migrating document:", error);
      setError(`Migration failed: ${error}`);
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle direct Firebase login
  const handleLogin = async () => {
    if (!email || !password) {
      setAuthError("Please enter both email and password");
      return;
    }
    
    setIsAuthLoading(true);
    setAuthError(null);
    
    try {
      console.log(`DEBUG: Attempting to sign in with email: ${email}`);
      
      // Get a fresh auth instance to avoid any stale state
      const freshAuth = getAuth();
      console.log("DEBUG: Got fresh auth instance");
      
      const userCredential = await signInWithEmailAndPassword(freshAuth, email, password);
      console.log("DEBUG: Login response received", userCredential);
      console.log("DEBUG: Login successful for UID:", userCredential.user.uid);
      console.log("DEBUG: User email:", userCredential.user.email);
      
      // Force token refresh to ensure tokens are valid
      const idToken = await userCredential.user.getIdToken(true);
      console.log("DEBUG: Auth token refreshed");
      
      // Check for user data in Firestore to verify data access works
      const userData = await checkUserDataAccess(userCredential.user.uid, userCredential.user.email || "");
      
      // If we found user data with a different document ID than the Firebase Auth UID,
      // we'll show a migration option
      setFoundUserData(userData);
      
      if (userData && userData.docId !== userCredential.user.uid) {
        console.log(`DEBUG: Found user data with mismatched ID. Firebase Auth UID: ${userCredential.user.uid}, Document ID: ${userData.docId}`);
      }
      
      // Display success message
      alert(`Successfully logged in as ${userCredential.user.email}`);
      
      setAuthError(null);
      
      // Clear form after successful login
      setEmail("");
      setPassword("");
      
      // Force a UI refresh by setting a state variable
      setLoading(true);
      setTimeout(() => {
        // Fetch collections to show data is working
        fetchCollections();
        setLoading(false);
      }, 500);
    } catch (err: any) {
      console.error("DEBUG: Login error:", err);
      console.error("DEBUG: Error code:", err.code);
      console.error("DEBUG: Error message:", err.message);
      
      setAuthError(err.message || "Login failed. Please check your credentials.");
      
      // Show more helpful errors for common cases
      if (err.code === 'auth/user-not-found') {
        setAuthError("No user found with this email. Please register first or check your email.");
      } else if (err.code === 'auth/wrong-password') {
        setAuthError("Incorrect password. Please try again.");
      } else if (err.code === 'auth/invalid-email') {
        setAuthError("Invalid email format. Please check your email.");
      } else if (err.code === 'auth/invalid-credential') {
        setAuthError("Invalid credentials. The email or password is incorrect.");
      }
    } finally {
      setIsAuthLoading(false);
    }
  };
  
  // Handle direct Firebase registration
  const handleRegister = async () => {
    if (!email || !password) {
      setAuthError("Please enter both email and password");
      return;
    }
    
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters long");
      return;
    }
    
    setIsAuthLoading(true);
    setAuthError(null);
    
    try {
      console.log(`DEBUG: Attempting to register with email: ${email}`);
      
      // Get a fresh auth instance
      const freshAuth = getAuth();
      console.log("DEBUG: Got fresh auth instance for registration");
      
      const userCredential = await createUserWithEmailAndPassword(freshAuth, email, password);
      console.log("DEBUG: Registration response received", userCredential);
      console.log("DEBUG: Registration successful for UID:", userCredential.user.uid);
      console.log("DEBUG: New user email:", userCredential.user.email);
      
      // Display success message  
      alert(`Successfully registered as ${userCredential.user.email}`);
      
      setAuthError(null);
      
      // Clear form after successful registration
      setEmail("");
      setPassword("");
      
      // Force a UI refresh
      setLoading(true);
      setTimeout(() => {
        // Fetch collections to show data is working
        fetchCollections();
        setLoading(false);
      }, 500);
    } catch (err: any) {
      console.error("DEBUG: Registration error:", err);
      console.error("DEBUG: Error code:", err.code);
      console.error("DEBUG: Error message:", err.message);
      
      setAuthError(err.message || "Registration failed.");
      
      // Show more helpful errors for common cases
      if (err.code === 'auth/email-already-in-use') {
        setAuthError("This email is already registered. Please log in instead.");
      } else if (err.code === 'auth/weak-password') {
        setAuthError("Password is too weak. Please use at least 6 characters.");
      } else if (err.code === 'auth/invalid-email') {
        setAuthError("Invalid email format. Please check your email.");
      } else if (err.code === 'auth/network-request-failed') {
        setAuthError("Network error. Please check your internet connection.");
      }
    } finally {
      setIsAuthLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      console.log("DEBUG: Attempting to sign out");
      const freshAuth = getAuth();
      await signOut(freshAuth);
      console.log("DEBUG: Logged out successfully");
      
      // Reset user data
      setFoundUserData(null);
      
      // Alert confirmation
      alert("You have been successfully logged out");
      
      // Force UI update
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error("DEBUG: Logout error:", err);
    }
  };

  // Format data for display in table
  const formatData = (data: any): string => {
    if (data === null || data === undefined) return "null";
    
    if (typeof data === "object") {
      if (data.toDate && typeof data.toDate === "function") {
        return formatTimestamp(data);
      }
      
      if (data.seconds && data.nanoseconds) {
        return formatTimestamp(data);
      }
      
      if (Array.isArray(data)) {
        return `Array(${data.length})`;
      }
      
      return JSON.stringify(data);
    }
    
    return String(data);
  };

  return (
    <>
      <Helmet>
        <title>Firebase Test | NeuroHealthHub</title>
      </Helmet>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Firebase Database Test</h1>
            <p className="text-muted-foreground">
              Verify Firebase connection and view database collections
            </p>
            {projectId && (
              <p className="text-sm mt-1">
                Project ID: <span className="font-mono">{projectId}</span>
              </p>
            )}
          </div>
          <Button onClick={fetchCollections} disabled={loading || (!user && !import.meta.env.DEV)}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Collections
          </Button>
        </div>

        {!user && !import.meta.env.DEV && (
          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertTitle>Authentication required</AlertTitle>
            <AlertDescription>
              You need to be logged in to access Firebase data. Please log in and try again.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <FileWarning className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              {error.includes('security rules') && (
                <div className="mt-2">
                  <p className="font-medium text-destructive">Security Rules Error Detected!</p>
                  <p className="my-2">This is the most common error when setting up Firebase. We've created a detailed solution:</p>
                  
                  <div className="bg-muted p-4 rounded-md border border-primary mt-3">
                    <h4 className="text-lg font-bold mb-2">Complete Solution:</h4>
                    <p>Follow the step-by-step guide in <code className="font-mono bg-primary/10 px-1 py-0.5 rounded text-primary font-bold">FIREBASE_COMPLETE_SETUP.md</code></p>
                    <p className="mt-2 text-sm">This guide includes:</p>
                    <ul className="list-disc ml-5 mt-1 text-sm">
                      <li>Exactly how to update your Firebase security rules</li>
                      <li>How to add your domain to authorized domains</li>
                      <li>Creating initial collections if needed</li>
                      <li>Troubleshooting the most common issues</li>
                    </ul>
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Authentication Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              {user ? (
                <>
                  <Shield className="mr-2 h-5 w-5 text-green-500" />
                  Authenticated as {user.email}
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-5 w-5" />
                  Firebase Authentication
                </>
              )}
            </CardTitle>
            <CardDescription>
              {user 
                ? "You are logged in and can access the Firebase database" 
                : "Log in to access Firebase data with proper authentication"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-md">
                  <p className="font-medium">User Information:</p>
                  <p className="text-sm mt-1">Email: {user.email}</p>
                  <p className="text-sm">UID: <span className="font-mono text-xs">{user.uid}</span></p>
                  
                  {/* Document ID information */}
                  {foundUserData && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="font-medium">Firestore Document:</p>
                      <p className="text-sm mt-1">Location: <span className="font-mono text-xs">{foundUserData.collection}</span></p>
                      <p className="text-sm">Document ID: <span className="font-mono text-xs">{foundUserData.docId}</span></p>
                      
                      {/* Show ID mismatch warning and migration option */}
                      {foundUserData.docId !== user.uid && (
                        <div className="mt-3 pt-3 border-t border-yellow-200 bg-yellow-50 -mx-4 -mb-4 p-4 rounded-b-md">
                          <p className="text-sm font-medium text-yellow-800">⚠️ ID Mismatch Detected</p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Your user document ID ({foundUserData.docId}) does not match your Firebase Auth UID ({user.uid}).
                            This can cause issues with data access.
                          </p>
                          
                          <Button
                            size="sm"
                            variant="default"
                            className="mt-2 w-full bg-yellow-500 hover:bg-yellow-600"
                            onClick={() => migrateUserDocument(
                              foundUserData.collection.split(' ')[0], // Get collection name without the "(by...)" part
                              foundUserData.docId,
                              user.uid
                            )}
                            disabled={isAuthLoading}
                          >
                            {isAuthLoading ? (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : null}
                            Migrate Document ID to Match Auth UID
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password"
                    type="password" 
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {authError && (
                  <Alert variant="destructive">
                    <AlertTitle>Authentication Error</AlertTitle>
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleLogin}
                    disabled={isAuthLoading}
                    className="flex-1"
                  >
                    {isAuthLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="mr-2 h-4 w-4" />
                    )}
                    Sign In
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleRegister}
                    disabled={isAuthLoading}
                    className="flex-1"
                  >
                    {isAuthLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    Register
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Use any email/password for testing purposes
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Firebase Connectivity Test</AlertTitle>
          <AlertDescription>
            <p>We are now attempting to connect to the real Firebase database. If you see "permission-denied" errors, please follow our new guide.</p>
            <p className="mt-2">See <code className="font-mono bg-muted px-1 py-0.5 rounded text-primary font-bold">FIREBASE_COMPLETE_SETUP.md</code> for a comprehensive solution that will fix the security rules.</p>
            <p className="mt-2">
              <Button variant="outline" onClick={() => fetchCollections()} className="mr-2">
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Firebase Connection
              </Button>
            </p>
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="collections">
          <TabsList className="mb-4">
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="documents" disabled={!selectedCollection}>
              Documents {selectedCollection && `(${selectedCollection})`}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="collections">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  Firebase Collections
                </CardTitle>
                <CardDescription>
                  {collections.length > 0 
                    ? `Found ${collections.length} collections and subcollections`
                    : 'No collections fetched yet. Click "Refresh Collections" to begin.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : collections.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Collection Name</TableHead>
                        <TableHead>Path</TableHead>
                        <TableHead className="text-right">Documents</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collections.map((collection) => (
                        <TableRow key={collection.path}>
                          <TableCell className="font-medium">
                            {collection.id.split('/').pop()}
                            {collection.path.includes('/') && (
                              <Badge variant="outline" className="ml-2">
                                Subcollection
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {collection.path}
                          </TableCell>
                          <TableCell className="text-right">
                            {collection.documentCount}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => fetchDocuments(collection.path)}
                              disabled={loading}
                            >
                              View Documents
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-6 text-muted-foreground">
                    No collections found. Click "Refresh Collections" to check available collections.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents">
            {selectedCollection && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Documents in {selectedCollection}
                  </CardTitle>
                  <CardDescription>
                    Found {documents.length} documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : documents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Document ID</TableHead>
                            <TableHead>Fields</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {documents.map((doc) => {
                            // Add better logging to debug document rendering issues
                            console.log("Rendering document:", doc.id, doc.data);
                            return (
                              <TableRow key={doc.id}>
                                <TableCell className="font-medium font-mono">
                                  {doc.id}
                                </TableCell>
                                <TableCell>
                                  {doc.data && typeof doc.data === 'object' ? (
                                    <div className="grid grid-cols-1 gap-1">
                                      {Object.entries(doc.data).map(([key, value]) => (
                                        <div key={key} className="flex items-start text-sm py-1 border-b border-muted last:border-0">
                                          <span className="font-medium mr-2 min-w-[120px]">{key}:</span>
                                          <span className="text-muted-foreground break-all">
                                            {formatData(value)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground italic">Empty document or error loading data</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-muted-foreground">
                      No documents found in this collection
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedCollection(null)}
                  >
                    Back to Collections
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default FirebaseTest;