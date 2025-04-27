// test-send-verification.ts
import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

// Use the same config as your frontend
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_PROJECT.firebaseapp.com",
  projectId: "YOUR_FIREBASE_PROJECT",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, "me-central1");

const call = httpsCallable(functions, "sendVerificationEmail");

call({
  email: "doctornerves@gmail.com",
  verificationLink: "https://neurohealthhub.replit.app/verify?token=abc123",
})
  .then((result) => {
    console.log("✅ Email sent:", result.data);
  })
  .catch((err) => {
    console.error("❌ Error sending email:", err.message);
  });