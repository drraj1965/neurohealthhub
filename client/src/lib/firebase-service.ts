import { auth, db, storage } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  sendEmailVerification
} from "firebase/auth";
import {
  doc, setDoc, getDoc, collection, getDocs,
  addDoc, updateDoc, query, where, orderBy, Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Register user
export async function registerUser(email: string, password: string, firstName: string, lastName: string, mobile?: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await updateProfile(user, {
    displayName: `${firstName} ${lastName}`
  });

  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
  const baseUrl = window.location.origin;
  await sendEmailVerification(user, {
    url: `${baseUrl}/email-verified`,
    handleCodeInApp: false,
  });

  localStorage.setItem(`user_pending_${user.uid}`, JSON.stringify({
    email,
    firstName,
    lastName,
    mobile: mobile || "",
    username
  }));

  return { ...user, pendingVerification: true };
}

// Login user
export async function loginUser(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  if (!user.emailVerified) {
    const baseUrl = window.location.origin;
    await sendEmailVerification(user, {
      url: `${baseUrl}/email-verified`,
      handleCodeInApp: false,
    });
    return { ...user, needsVerification: true };
  }

  await user.getIdToken(true);
  return user;
}

// Logout user
export async function logoutUser() {
  await signOut(auth);
}

// Get all doctors
export async function getAllDoctors() {
  const doctorsRef = collection(db, "doctors");
  const snapshot = await getDocs(doctorsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Submit question
export async function submitQuestion(data: {
  userId: string;
  doctorId: string;
  title: string;
  content: string;
  questionType: string;
  attachments?: string[];
}) {
  const userRef = collection(db, "users", data.userId, "my_questions");
  const userDoc = await addDoc(userRef, {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublic: false
  });

  const doctorRef = collection(db, "doctors", data.doctorId, "user_questions");
  await addDoc(doctorRef, {
    ...data,
    questionId: userDoc.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublic: false
  });

  return userDoc.id;
}

// Get user's questions
export async function getUserQuestions(userId: string) {
  const qRef = collection(db, "users", userId, "my_questions");
  const q = query(qRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Get today's questions for a user
export async function getTodaysUserQuestions(userId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const qRef = collection(db, "users", userId, "my_questions");
  const q = query(qRef, where("createdAt", ">=", startOfDay), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Get questions assigned to a doctor
export async function getDoctorQuestions(doctorId: string) {
  const qRef = collection(db, "doctors", doctorId, "user_questions");
  const q = query(qRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Submit answer to a question
export async function submitAnswer(answer: {
  questionId: string;
  userId: string;
  doctorId: string;
  content: string;
  attachments?: string[];
}) {
  const qRef = doc(db, "users", answer.userId, "my_questions", answer.questionId);
  const snapshot = await getDoc(qRef);
  if (!snapshot.exists()) throw new Error("Question not found");

  const qData = snapshot.data();
  const answers = qData.answers || [];
  answers.push({ ...answer, createdAt: new Date() });

  await updateDoc(qRef, {
    answers,
    updatedAt: new Date()
  });

  // Mirror update in doctor's subcollection
  const doctorRef = collection(db, "doctors", answer.doctorId, "user_questions");
  const q = query(doctorRef, where("questionId", "==", answer.questionId));
  const dSnapshot = await getDocs(q);
  if (!dSnapshot.empty) {
    await updateDoc(dSnapshot.docs[0].ref, {
      answers,
      updatedAt: new Date()
    });
  }

  return true;
}

// Upload file
export async function uploadFile(file: File, path: string) {
  const fileRef = ref(storage, path);
  const snap = await uploadBytes(fileRef, file);
  return await getDownloadURL(snap.ref);
}
export { auth, db, storage } from "./firebase";