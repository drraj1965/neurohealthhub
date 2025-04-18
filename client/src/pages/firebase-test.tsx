import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { 
  collection, 
  getDocs, 
  query, 
  getFirestore, 
  collectionGroup,
  doc,
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Database, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to fetch all collections and subcollections
  const fetchCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      // Root level collections
      const rootCollections = ["users", "doctors", "questions", "answers"];
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

          // Check for subcollections in each document
          for (const docSnapshot of querySnapshot.docs) {
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
        } catch (err) {
          console.log(`Collection ${collectionName} might not exist:`, err);
        }
      }

      setCollections(collectionsData);
      setError(null);
    } catch (err) {
      console.error("Error fetching collections:", err);
      setError("Failed to fetch collections. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch documents for a specific collection
  const fetchDocuments = async (collectionPath: string) => {
    setLoading(true);
    setError(null);
    try {
      const pathSegments = collectionPath.split('/');
      // Create collection reference based on path segments
      let collectionRef;
      if (pathSegments.length === 1) {
        collectionRef = collection(db, pathSegments[0]);
      } else if (pathSegments.length === 3) {
        collectionRef = collection(db, pathSegments[0], pathSegments[1], pathSegments[2]);
      } else {
        throw new Error(`Unsupported collection path format: ${collectionPath}`);
      }
      
      const querySnapshot = await getDocs(query(collectionRef));
      
      const documentsData: Document[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        path: `${collectionPath}/${doc.id}`,
        data: doc.data()
      }));
      
      setDocuments(documentsData);
      setSelectedCollection(collectionPath);
      setError(null);
    } catch (err) {
      console.error(`Error fetching documents for ${collectionPath}:`, err);
      setError(`Failed to fetch documents for ${collectionPath}. Check console for details.`);
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

  // Load collections on mount
  useEffect(() => {
    fetchCollections();
  }, []);

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
          </div>
          <Button onClick={fetchCollections} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/20 text-destructive p-4 rounded-md mb-6">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

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
                  Found {collections.length} collections and subcollections
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
                    No collections found
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
                          {documents.map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell className="font-medium font-mono">
                                {doc.id}
                              </TableCell>
                              <TableCell>
                                <div className="grid grid-cols-1 gap-1">
                                  {Object.entries(doc.data).map(([key, value]) => (
                                    <div key={key} className="flex items-start text-sm">
                                      <span className="font-medium mr-2">{key}:</span>
                                      <span className="text-muted-foreground break-all">
                                        {formatData(value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
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