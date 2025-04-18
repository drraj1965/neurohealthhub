import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, connectAuthEmulator } from "firebase/auth";
import { 
  getFirestore, doc, setDoc, getDoc, collection, getDocs, addDoc, updateDoc, query, where, orderBy,
  connectFirestoreEmulator
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
const db = getFirestore(app);
const storage = getStorage(app);

// Use mock data for development since we're having issues with Firebase security rules
const USE_MOCK_DATA = true;

if (import.meta.env.DEV && USE_MOCK_DATA) {
  console.log("🔄 Using local mock data for development");
}

// Add sample doctor data in development mode - this will run only in development
async function initializeSampleData() {
  if (import.meta.env.DEV) {
    try {
      console.log("DEV MODE: Checking if sample data needs to be initialized");
      
      // Check if doctor data exists
      const doctorsCollection = collection(db, "doctors");
      
      try {
        const doctorsQuery = await getDocs(doctorsCollection);
        
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
      } catch (queryError: any) {
        if (queryError.code === 'permission-denied') {
          console.warn("DEV: Permission denied accessing doctors collection. Check Firebase security rules.");
          console.warn("DEV: View firebase_firestore_rules_dev.txt for recommended development rules.");
        } else {
          console.error("DEV: Error querying doctors:", queryError);
        }
      }
    } catch (error) {
      console.error("DEV: Error initializing sample data:", error);
    }
  }
}

// Call the function to initialize sample data
initializeSampleData()
  .catch(err => {
    console.error("Failed to initialize sample data:", err);
  });

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
    const userDoc = await getDoc(doc(db, "users", userId));
    const doctorDoc = await getDoc(doc(db, "doctors", userId));
    
    if (userDoc.exists()) {
      return { ...userDoc.data(), id: userId };
    } else if (doctorDoc.exists()) {
      return { ...doctorDoc.data(), id: userId };
    }
    
    return null;
  } catch (error) {
    console.error("Get user data error:", error);
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

const mockQuestions: any[] = [];
const mockUsers: any[] = [];

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
    throw error;
  }
}

// Get questions for a user
export async function getUserQuestions(userId: string) {
  try {
    const questionsRef = collection(db, "users", userId, "my_questions");
    const q = query(questionsRef, orderBy("createdAt", "desc"));
    const questionDocs = await getDocs(q);
    
    return questionDocs.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Get user questions error:", error);
    throw error;
  }
}

// Get today's questions for a user
export async function getTodaysUserQuestions(userId: string) {
  try {
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
    throw error;
  }
}

// Get questions for a doctor
export async function getDoctorQuestions(doctorId: string) {
  try {
    const questionsRef = collection(db, "doctors", doctorId, "user_questions");
    const q = query(questionsRef, orderBy("createdAt", "desc"));
    const questionDocs = await getDocs(q);
    
    return questionDocs.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Get doctor questions error:", error);
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
    throw error;
  }
}

// File upload function
export async function uploadFile(file: File, path: string) {
  try {
    const storageRef = ref(storage, path);
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("File upload error:", error);
    throw error;
  }
}

export { auth, db, storage };
