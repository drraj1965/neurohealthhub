import * as admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";

let app: admin.app.App;

if (!admin.apps.length) {
  const serviceAccountPath = path.resolve(
    __dirname,
    "../secrets/neurohealthhub-1965-firebase-adminsdk-fbsvc-b15474d7f4.json"
  );

  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  app = admin.app();
}

export const db = admin.firestore();
export const auth = admin.auth();
