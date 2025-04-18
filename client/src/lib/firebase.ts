import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, connectAuthEmulator } from "firebase/auth";
import { 
  getFirestore, doc, setDoc, getDoc, collection, getDocs, addDoc, updateDoc, query, where, orderBy,
  connectFirestoreEmulator, enableIndexedDbPersistence, Timestamp, serverTimestamp
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, connectStorageEmulator } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Log Firebase config for debugging (without sensitive values)
console.log('Firebase initialized with project:', import.meta.env.VITE_FIREBASE_PROJECT_ID);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore - for named databases, this is handled in the Firebase console
// and we don't specify the name in the code
const db = getFirestore(app);
console.log("Connecting to Firebase Firestore database");

const storage = getStorage(app);

// Enable offline persistence - this allows the app to work offline
// and sync when back online
enableIndexedDbPersistence(db).catch((err) => {
  console.error("Firebase persistence error:", err.code);
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    console.warn("Firestore persistence unavailable: Multiple tabs open");
  } else if (err.code === 'unimplemented') {
    // The current browser does not support persistence
    console.warn("Firestore persistence unavailable: Browser unsupported");
  }
});

// Set to false to use actual Firebase database
const USE_MOCK_DATA = false;
// Set to false to prevent auto-initialization of sample data
const AUTO_INITIALIZE_SAMPLE_DATA = false;

if (import.meta.env.DEV && USE_MOCK_DATA) {
  console.log("🔄 Using local mock data for development");
  
  // Add console message to help developers understand what's happening
  console.warn("⚠️ DEVELOPMENT MODE: Using local mock data instead of Firebase.");
  console.warn("To use actual Firebase data, you must update security rules in your Firebase console.");
  console.warn("See README_FIREBASE_SETUP.md for detailed instructions.");
}

// Add sample doctor data in development mode - this will run only in development
// and only if AUTO_INITIALIZE_SAMPLE_DATA is true
async function initializeSampleData() {
  if (import.meta.env.DEV) {
    try {
      console.log("DEV MODE: Checking if sample data needs to be initialized");
      
      // Check if doctor data exists - try both regular collection path and named database path
      // First try with default database path
      const doctorsCollection = collection(db, "doctors");
      let doctorsQuery;
      let querySuccessful = false;
      
      try {
        doctorsQuery = await getDocs(doctorsCollection);
        console.log("Successfully queried 'doctors' collection");
        querySuccessful = true;
      } catch (error: any) {
        if (error.code === 'permission-denied' || error.message?.includes('different database')) {
          // If there's a permission error or database mismatch, try with database name in the path
          console.log("Initial query failed, trying with neurohealthhub/doctors path");
          try {
            const namedDbCollection = collection(db, "neurohealthhub/doctors");
            doctorsQuery = await getDocs(namedDbCollection);
            console.log("Successfully queried 'neurohealthhub/doctors' collection");
            querySuccessful = true;
          } catch (namedError) {
            console.error("Error querying named database path:", namedError);
          }
        } else {
          console.error("Error querying doctors collection:", error);
        }
      }
      
      // Only proceed if one of the queries was successful
      if (querySuccessful && doctorsQuery) {
        if (doctorsQuery.empty) {
          console.log("DEV: No doctors found, adding sample doctor data");
          
          // Add some sample doctors
          const doctors = [
            {
              firstName: "Dr.",
              lastName: "Rajshekher",
              email: "doctornerves@gmail.com",
              mobile: "+971501802970",
              specialization: "Neurology",
              experience: "15 years",
              bio: "Specialist in neurological disorders with focus on brain and spinal cord injuries.",
              isAdmin: true,
              username: "doctornerves"
            },
            {
              firstName: "Dr.",
              lastName: "Ponnu",
              email: "drponnu@neurohealth.com",
              mobile: "+971501234567",
              specialization: "Neurosurgery",
              experience: "12 years",
              bio: "Experienced neurosurgeon specializing in complex brain surgeries.",
              isAdmin: true,
              username: "drponnu"
            },
            {
              firstName: "Dr.",
              lastName: "Zain",
              email: "drzain@neurohealth.com",
              mobile: "+971507654321",
              specialization: "Psychiatry",
              experience: "8 years",
              bio: "Psychiatrist focusing on neurological disorders affecting mental health.",
              isAdmin: true,
              username: "drzain"
            }
          ];
          
          // Try to add each doctor individually to catch permission errors
          let addedCount = 0;
          for (const doctor of doctors) {
            try {
              const docRef = doc(db, "doctors", `dev-${doctor.username}-${Math.floor(Math.random() * 1000)}`);
              await setDoc(docRef, {
                ...doctor,
                createdAt: new Date()
              });
              addedCount++;
            } catch (docError: any) {
              if (docError.code === 'permission-denied') {
                console.warn("DEV: Permission denied adding doctor - check Firebase security rules");
                break;
              } else {
                console.error("DEV: Error adding doctor:", docError);
              }
            }
          }
          
          if (addedCount > 0) {
            console.log(`DEV: Added ${addedCount} sample doctors successfully`);
          } else {
            console.warn("DEV: Could not add any sample doctors. You may need to set up Firebase security rules.");
          }
        } else {
          console.log(`DEV: ${doctorsQuery.size} doctors already exist, skipping initialization`);
        }
      } else {
        console.warn("DEV: Could not query doctors collection. Check Firebase security rules or database path.");
      }
    } catch (error) {
      console.error("DEV: Error initializing sample data:", error);
    }
  }
}

// Call the function to initialize sample data only if AUTO_INITIALIZE_SAMPLE_DATA is true
if (AUTO_INITIALIZE_SAMPLE_DATA) {
  console.log("Auto-initializing sample data is enabled");
  initializeSampleData()
    .catch(err => {
      console.error("Failed to initialize sample data:", err);
    });
} else {
  console.log("Auto-initializing sample data is disabled - using only real database data");
}

// Authentication functions
export async function registerUser(email: string, password: string, firstName: string, lastName: string, mobile?: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create a username from first name and last name
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
    
    // Update display name
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`
    });
    
    // Store additional user data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email,
      firstName,
      lastName,
      mobile: mobile || "",
      isAdmin: false,
      username
    });
    
    return user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

// User data functions
export async function getUserData(userId: string) {
  try {
    if (import.meta.env.DEV && USE_MOCK_DATA) {
      console.log("🔄 Using mock user data");
      
      // Check if it's a mock user
      const mockUser = mockUsers.find(user => user.id === userId);
      if (mockUser) return mockUser;
      
      // Check if it's a mock doctor
      const mockDoctor = mockDoctors.find(doctor => doctor.id === userId);
      if (mockDoctor) return mockDoctor;
      
      // For demo purposes, return the first mock user if userId doesn't match
      if (userId) return mockUsers[0];
      
      return null;
    }
    
    // Try both regular and named database paths
    let userDoc, doctorDoc;
    
    try {
      // First try the standard path
      userDoc = await getDoc(doc(db, "users", userId));
    } catch (error: any) {
      if (error.message.includes('different database')) {
        // Try the named database path
        console.log("Trying alternative path for users collection");
        userDoc = await getDoc(doc(db, "neurohealthhub/users", userId));
      } else {
        throw error;
      }
    }
    
    try {
      // First try the standard path
      doctorDoc = await getDoc(doc(db, "doctors", userId));
    } catch (error: any) {
      if (error.message.includes('different database')) {
        // Try the named database path
        console.log("Trying alternative path for doctors collection");
        doctorDoc = await getDoc(doc(db, "neurohealthhub/doctors", userId));
      } else {
        throw error;
      }
    }
    
    if (userDoc && userDoc.exists()) {
      return { ...userDoc.data(), id: userId };
    } else if (doctorDoc && doctorDoc.exists()) {
      return { ...doctorDoc.data(), id: userId };
    }
    
    return null;
  } catch (error) {
    console.error("Get user data error:", error);
    
    if (import.meta.env.DEV && USE_MOCK_DATA) {
      console.log("🔄 Falling back to mock user data after error");
      
      // Check mock data for the user
      const mockUser = mockUsers.find(user => user.id === userId);
      if (mockUser) return mockUser;
      
      // Check if it's a mock doctor
      const mockDoctor = mockDoctors.find(doctor => doctor.id === userId);
      if (mockDoctor) return mockDoctor;
      
      // For demo purposes, return the first mock user
      if (userId) return mockUsers[0];
    }
    
    throw error;
  }
}

// Mock data for development
const mockDoctors = [
  {
    id: "dev-doctornerves-123",
    firstName: "Dr.",
    lastName: "Rajshekher",
    email: "doctornerves@gmail.com",
    mobile: "+971501802970",
    specialization: "Neurology",
    experience: "15 years",
    bio: "Specialist in neurological disorders with focus on brain and spinal cord injuries.",
    isAdmin: true,
    username: "doctornerves",
    createdAt: new Date()
  },
  {
    id: "dev-drponnu-456",
    firstName: "Dr.",
    lastName: "Ponnu",
    email: "drponnu@neurohealth.com",
    mobile: "+971501234567",
    specialization: "Neurosurgery",
    experience: "12 years",
    bio: "Experienced neurosurgeon specializing in complex brain surgeries.",
    isAdmin: true,
    username: "drponnu",
    createdAt: new Date()
  },
  {
    id: "dev-drzain-789",
    firstName: "Dr.",
    lastName: "Zain",
    email: "drzain@neurohealth.com",
    mobile: "+971507654321",
    specialization: "Psychiatry",
    experience: "8 years",
    bio: "Psychiatrist focusing on neurological disorders affecting mental health.",
    isAdmin: true,
    username: "drzain",
    createdAt: new Date()
  }
];

// Mock users data
const mockUsers = [
  {
    id: "mock-user-1",
    email: "johndoe@example.com",
    firstName: "John",
    lastName: "Doe",
    mobile: "+971501111111",
    isAdmin: false,
    username: "johndoe",
    createdAt: new Date()
  },
  {
    id: "mock-user-2",
    email: "janesmith@example.com",
    firstName: "Jane",
    lastName: "Smith",
    mobile: "+971502222222",
    isAdmin: false,
    username: "janesmith",
    createdAt: new Date()
  }
];

// Mock questions data
const mockQuestions = [
  {
    id: "mock-question-1",
    title: "Headache treatments",
    content: "What are the most effective treatments for chronic migraines?",
    userId: "mock-user-1",
    doctorId: "dev-doctornerves-123",
    questionType: "general",
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    updatedAt: new Date(Date.now() - 3600000),
    isPublic: true,
    answers: []
  },
  {
    id: "mock-question-2",
    title: "Brain fog symptoms",
    content: "I've been experiencing brain fog for several weeks. Is this a symptom of a neurological condition?",
    userId: "mock-user-2",
    doctorId: "dev-drponnu-456",
    questionType: "diagnosis",
    createdAt: new Date(Date.now() - 7200000), // 2 hours ago
    updatedAt: new Date(Date.now() - 7200000),
    isPublic: false,
    answers: [
      {
        content: "Brain fog can have many causes, ranging from stress to more serious conditions. I'd need more information to provide proper guidance.",
        doctorId: "dev-drponnu-456",
        createdAt: new Date(Date.now() - 3600000) // 1 hour ago
      }
    ]
  },
  {
    id: "mock-question-3",
    title: "Neurological effects of COVID-19",
    content: "What are the latest findings on the long-term neurological effects of COVID-19?",
    userId: "mock-user-1",
    doctorId: "dev-drzain-789",
    questionType: "research",
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000),
    isPublic: true,
    answers: []
  }
];

// Doctor functions
export async function getAllDoctors() {
  try {
    if (import.meta.env.DEV && USE_MOCK_DATA) {
      console.log("🔄 Using mock doctor data");
      return mockDoctors;
    }
    
    const doctorsRef = collection(db, "doctors");
    const doctorDocs = await getDocs(doctorsRef);
    
    return doctorDocs.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Get all doctors error:", error);
    
    if (import.meta.env.DEV && USE_MOCK_DATA) {
      console.log("🔄 Falling back to mock doctor data after error");
      return mockDoctors;
    }
    
    throw error;
  }
}

// Question functions
export async function submitQuestion(questionData: {
  userId: string;
  doctorId: string;
  title: string;
  content: string;
  questionType: string;
  attachments?: string[];
}) {
  try {
    if (import.meta.env.DEV && USE_MOCK_DATA) {
      console.log("🔄 Using mock data for submitting question");
      
      // Generate a mock question ID
      const mockQuestionId = `mock-question-${Date.now()}`;
      
      // Create a new mock question
      const newQuestion = {
        id: mockQuestionId,
        ...questionData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: false,
        answers: []
      };
      
      // Add it to our mock questions array
      mockQuestions.push(newQuestion);
      
      console.log("🔄 Added mock question:", newQuestion);
      
      return mockQuestionId;
    }
    
    // Add question to user's subcollection
    const userQuestionRef = await addDoc(collection(db, "users", questionData.userId, "my_questions"), {
      ...questionData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false
    });
    
    // Add question to doctor's subcollection
    await addDoc(collection(db, "doctors", questionData.doctorId, "user_questions"), {
      ...questionData,
      questionId: userQuestionRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false
    });
    
    return userQuestionRef.id;
  } catch (error) {
    console.error("Submit question error:", error);
    
    if (import.meta.env.DEV && USE_MOCK_DATA) {
      console.log("🔄 Falling back to mock for submitting question after error");
      
      // Generate a mock question ID
      const mockQuestionId = `mock-question-${Date.now()}`;
      
      // Create a new mock question
      const newQuestion = {
        id: mockQuestionId,
        ...questionData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: false,
        answers: []
      };
      
      // Add it to our mock questions array
      mockQuestions.push(newQuestion);
      
      return mockQuestionId;
    }
    
    throw error;
  }
}

// Get questions for a user
export async function getUserQuestions(userId: string) {
  try {
    if (import.meta.env.DEV && USE_MOCK_DATA) {
      console.log("🔄 Using mock user questions data");
      return mockQuestions.filter(q => q.userId === userId);
    }
    
    const questionsRef = collection(db, "users", userId, "my_questions");
    const q = query(questionsRef, orderBy("createdAt", "desc"));
    const questionDocs = await getDocs(q);
    
    return questionDocs.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Get user questions error:", error);
    
    if (import.meta.env.DEV && USE_MOCK_DATA) {
      console.log("🔄 Falling back to mock user questions data after error");
      return mockQuestions.filter(q => q.userId === userId);
    }
    
    throw error;
  }
}

// Get today's questions for a user
export async function getTodaysUserQuestions(userId: string) {
  try {
    if (import.meta.env.DEV && USE_MOCK_DATA) {
      console.log("🔄 Using mock today's questions data");
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      return mockQuestions.filter(q => 
        q.userId === userId && 
        q.createdAt instanceof Date && 
        q.createdAt >= startOfDay
      );
    }
    
    const questionsRef = collection(db, "users", userId, "my_questions");
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const q = query(
      questionsRef,
      where("createdAt", ">=", startOfDay),
      orderBy("createdAt", "desc")
    );
    
    const questionDocs = await getDocs(q);
    
    return questionDocs.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Get today's user questions error:", error);
    
    if (import.meta.env.DEV && USE_MOCK_DATA) {
      console.log("🔄 Falling back to mock today's questions data after error");
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      return mockQuestions.filter(q => 
        q.userId === userId && 
        q.createdAt instanceof Date && 
        q.createdAt >= startOfDay
      );
    }
    
    throw error;
  }
}

// Get questions for a doctor
export async function getDoctorQuestions(doctorId: string) {
  try {
    if (import.meta.env.DEV && USE_MOCK_DATA) {
      console.log("🔄 Using mock doctor questions data");
      return mockQuestions.filter(q => q.doctorId === doctorId);
    }
    
    const questionsRef = collection(db, "doctors", doctorId, "user_questions");
    const q = query(questionsRef, orderBy("createdAt", "desc"));
    const questionDocs = await getDocs(q);
    
    return questionDocs.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Get doctor questions error:", error);
    
    if (import.meta.env.DEV && USE_MOCK_DATA) {
      console.log("🔄 Falling back to mock doctor questions data after error");
      return mockQuestions.filter(q => q.doctorId === doctorId);
    }
    
    throw error;
  }
}

// Answer functions
export async function submitAnswer(answer: {
  questionId: string;
  userId?: string;
  doctorId?: string;
  content: string;
  attachments?: string[];
}) {
  try {
    if (import.meta.env.DEV && USE_MOCK_DATA) {
      console.log("🔄 Using mock data for submitting answer");
      
      // Find the question in our mock data
      const questionIndex = mockQuestions.findIndex(q => q.id === answer.questionId);
      
      if (questionIndex === -1) {
        console.error("Question not found in mock data:", answer.questionId);
        throw new Error("Question not found");
      }
      
      // Add the answer to the question
      const newAnswer = {
        ...answer,
        createdAt: new Date()
      };
      
      // Update the question with the new answer
      if (!mockQuestions[questionIndex].answers) {
        mockQuestions[questionIndex].answers = [];
      }
      
      mockQuestions[questionIndex].answers.push(newAnswer);
      mockQuestions[questionIndex].updatedAt = new Date();
      
      console.log("🔄 Added mock answer:", newAnswer);
      console.log("🔄 Updated question:", mockQuestions[questionIndex]);
      
      return true;
    }
    
    // Add the answer to the question document
    const questionRef = doc(db, "users", answer.userId || "", "my_questions", answer.questionId);
    const questionDoc = await getDoc(questionRef);
    
    if (!questionDoc.exists()) {
      throw new Error("Question not found");
    }
    
    const questionData = questionDoc.data();
    const answers = questionData.answers || [];
    
    answers.push({
      ...answer,
      createdAt: new Date()
    });
    
    await updateDoc(questionRef, {
      answers,
      updatedAt: new Date()
    });
    
    // Update the same in doctor's collection
    if (questionData.doctorId) {
      const doctorQuestionQuery = query(
        collection(db, "doctors", questionData.doctorId, "user_questions"),
        where("questionId", "==", answer.questionId)
      );
      
      const doctorQuestionDocs = await getDocs(doctorQuestionQuery);
      
      if (!doctorQuestionDocs.empty) {
        const doctorQuestionDoc = doctorQuestionDocs.docs[0];
        await updateDoc(doctorQuestionDoc.ref, {
          answers,
          updatedAt: new Date()
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error("Submit answer error:", error);
    
    if (import.meta.env.DEV && USE_MOCK_DATA) {
      console.log("🔄 Falling back to mock for submitting answer after error");
      
      // Try to find the question in our mock data
      const questionIndex = mockQuestions.findIndex(q => q.id === answer.questionId);
      
      if (questionIndex === -1) {
        console.error("Question not found in mock data:", answer.questionId);
        // For development, let's just add to the first question if not found
        if (mockQuestions.length > 0) {
          if (!mockQuestions[0].answers) {
            mockQuestions[0].answers = [];
          }
          
          const newAnswer = {
            ...answer,
            createdAt: new Date()
          };
          
          mockQuestions[0].answers.push(newAnswer);
          mockQuestions[0].updatedAt = new Date();
          console.log("🔄 Added mock answer to first question instead:", newAnswer);
          return true;
        }
        
        throw new Error("No questions found in mock data");
      }
      
      // Add the answer to the question
      const newAnswer = {
        ...answer,
        createdAt: new Date()
      };
      
      // Update the question with the new answer
      if (!mockQuestions[questionIndex].answers) {
        mockQuestions[questionIndex].answers = [];
      }
      
      mockQuestions[questionIndex].answers.push(newAnswer);
      mockQuestions[questionIndex].updatedAt = new Date();
      
      return true;
    }
    
    throw error;
  }
}

// File upload function
export async function uploadFile(file: File, path: string) {
  try {
    if (import.meta.env.DEV && USE_MOCK_DATA) {
      console.log("🔄 Using mock file upload");
      
      // Create a mock URL for the file that looks realistic but is clearly a mock
      const mockFileExtension = file.name.split('.').pop();
      const mockFileName = `mock-upload-${Date.now()}.${mockFileExtension}`;
      const mockDownloadURL = `https://firebasestorage.googleapis.com/mock/neurohealthhub/uploads/${mockFileName}`;
      
      console.log(`🔄 Mock uploaded file: ${file.name} (${file.size} bytes) to ${path}`);
      console.log(`🔄 Mock download URL: ${mockDownloadURL}`);
      
      return mockDownloadURL;
    }
    
    const storageRef = ref(storage, path);
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("File upload error:", error);
    
    if (import.meta.env.DEV && USE_MOCK_DATA) {
      console.log("🔄 Falling back to mock file upload after error");
      
      // Create a mock URL for the file that looks realistic but is clearly a mock
      const mockFileExtension = file.name.split('.').pop();
      const mockFileName = `mock-upload-${Date.now()}.${mockFileExtension}`;
      const mockDownloadURL = `https://firebasestorage.googleapis.com/mock/neurohealthhub/uploads/${mockFileName}`;
      
      return mockDownloadURL;
    }
    
    throw error;
  }
}

export { auth, db, storage };
