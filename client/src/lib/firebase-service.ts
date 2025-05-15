import { app, auth, db, storage } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  sendEmailVerification,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ✅ User Registration
export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  mobile?: string
) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: `${firstName} ${lastName}` });

  await sendEmailVerification(user, {
    url: `${window.location.origin}/email-verified`,
    handleCodeInApp: false,
  });

  localStorage.setItem(`user_pending_${user.uid}`, JSON.stringify({
    email,
    firstName,
    lastName,
    mobile: mobile || "",
    username: `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
  }));

  return { ...user, pendingVerification: true };
}

// ✅ User Login
export async function loginUser(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  if (!user.emailVerified) {
    await sendEmailVerification(user, {
      url: `${window.location.origin}/email-verified`,
      handleCodeInApp: false,
    });
    return { ...user, needsVerification: true };
  }

  await user.getIdToken(true);
  return user;
}

// ✅ User Logout
export async function logoutUser() {
  await signOut(auth);
}

// ✅ File Upload
export async function uploadFile(file: File, path: string) {
  const fileRef = ref(storage, path);
  const snap = await uploadBytes(fileRef, file);
  return await getDownloadURL(snap.ref);
}

// ✅ Get All Doctors
export async function getAllDoctors() {
  const snapshot = await getDocs(collection(db, "doctors"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ✅ Submit Question
export async function submitQuestion(data: {
  userId: string;
  doctorId: string;
  title: string;
  content: string;
  questionType: string;
  attachments?: string[];
}) {
  const userDocRef = collection(db, "users", data.userId, "my_questions");
  const userDoc = await addDoc(userDocRef, {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublic: false,
  });

  const doctorRef = collection(db, "doctors", data.doctorId, "user_questions");
  await addDoc(doctorRef, {
    ...data,
    questionId: userDoc.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublic: false,
  });

  return userDoc.id;
}

// ✅ Get User's Questions
export async function getUserQuestions(userId: string) {
  const snapshot = await getDocs(query(collection(db, "users", userId, "my_questions"), orderBy("createdAt", "desc")));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ✅ Get Today's User Questions
export async function getTodaysUserQuestions(userId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const snapshot = await getDocs(query(collection(db, "users", userId, "my_questions"), where("createdAt", ">=", startOfDay), orderBy("createdAt", "desc")));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ✅ Get Doctor's Questions
export async function getDoctorQuestions(doctorId: string) {
  const snapshot = await getDocs(query(collection(db, "doctors", doctorId, "user_questions"), orderBy("createdAt", "desc")));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ✅ Submit Answer to a Question
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

  await updateDoc(qRef, { answers, updatedAt: new Date() });

  const doctorQSnapshot = await getDocs(query(collection(db, "doctors", answer.doctorId, "user_questions"), where("questionId", "==", answer.questionId)));
  if (!doctorQSnapshot.empty) {
    await updateDoc(doctorQSnapshot.docs[0].ref, { answers, updatedAt: new Date() });
  }

  return true;
}

// ✅ Ensure Exports Are Available to Other Files
export { auth, db, storage, app };