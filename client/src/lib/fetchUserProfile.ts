import { doc, getDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';

export async function fetchUserProfile(uid: string) {
  console.log(`[fetchUserProfile] Fetching profile for UID: ${uid}`);
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log("[fetchUserProfile] Document found:", data);

      const firstName = data.firstName || "";
      const lastName = data.lastName || "";
      const username = data.username || "";

      if (!firstName && !lastName) {
        console.warn("[fetchUserProfile] firstName/lastName missing, falling back to username:", username);
      }

      return {
        firstName,
        lastName,
      };
    } else {
      console.warn("[fetchUserProfile] No document found for UID:", uid);
      return { firstName: "", lastName: "" };
    }
  } catch (error) {
    console.error("[fetchUserProfile] Error fetching user profile:", error);
    return { firstName: "", lastName: "" };
  }
}