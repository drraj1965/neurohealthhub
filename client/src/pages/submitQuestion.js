import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export async function submitQuestion(userId, doctorId, questionText, attachments = []) {
  try {
    const docRef = await addDoc(collection(db, "questions"), {
      userId,
      doctorId,
      questionText,
      attachments,
      createdAt: Timestamp.now(),
      responses: []
    });
    console.log("Question submitted: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}