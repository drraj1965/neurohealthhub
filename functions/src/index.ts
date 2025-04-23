// functions/src/index.ts
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import type { Request, Response } from "express";
import path from "path";
import { readFileSync } from "fs";

// ✅ Point to your actual service account file
const serviceAccountPath = path.resolve(__dirname, "../secrets/neurohealthhub-1965-firebase-adminsdk-fbsvc-b15474d7f4.json");

// ✅ Manually load credentials instead of relying on GOOGLE_APPLICATION_CREDENTIALS env
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

// ✅ Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ✅ Cloud Function deployed in me-central1
export const myFunction = onRequest(
  { region: "me-central1" },
  async (req: Request, res: Response) => {
    try {
      const timestamp = new Date().toISOString();
      const testRef = db.collection("deployment_test").doc("lastDeploy");

      await testRef.set({
        status: "Function working from me-central1",
        timestamp,
      });

      res.send(`✅ Hello from NeuroHealthHub! Function updated at ${timestamp}`);
    } catch (error) {
      console.error("Function error:", error);
      res.status(500).send("❌ Error writing to Firestore.");
    }
  }
);