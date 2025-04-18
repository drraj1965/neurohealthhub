import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, addDoc, updateDoc, query, where, orderBy } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

// Doctor functions
export async function getAllDoctors() {
  try {
    const doctorsRef = collection(db, "doctors");
    const doctorDocs = await getDocs(doctorsRef);
    
    return doctorDocs.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Get all doctors error:", error);
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
