import * as admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";

// Load service account key
const serviceAccountPath = path.resolve(__dirname, "./secrets/neurohealthhub-1965-firebase-adminsdk-fbsvc-b15474d7f4.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const triggerFunction = async () => {
  const userId = "testuser123";
  const questionData = {
    uid: "s0am7yH6MPSD0TLtJk2iWbPVfXB3", // Admin user
    content: "🧪 Test question from CLI using admin UID",
    timestamp: new Date().toISOString(),
  };

  try {
    const docRef = await db
      .collection("users")
      .doc(userId)
      .collection("my_questions")
      .add(questionData);

    console.log(`✅ Firestore document created at: users/${userId}/my_questions/${docRef.id}`);
  } catch (error) {
    console.error("❌ Failed to write Firestore document:", error);
  }
};

triggerFunction();