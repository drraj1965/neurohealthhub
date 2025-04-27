import { config } from "dotenv";
config();

import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { defineSecret } from "firebase-functions/params";
import sendgrid from "@sendgrid/mail";
import twilio from "twilio";

import { db } from "./firebase-admin"; // ✅ Use shared db instance
import { sendVerificationEmail } from "./send-verification"; // ✅ Callable export
export { sendVerificationEmail };

// ✅ Set global region
setGlobalOptions({ region: "me-central1" });

// ✅ Define secrets
const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");
const SENDGRID_SENDER = defineSecret("SENDGRID_SENDER");
const TWILIO_SID = defineSecret("TWILIO_SID");
const TWILIO_TOKEN = defineSecret("TWILIO_TOKEN");
const TWILIO_WHATSAPP = defineSecret("TWILIO_WHATSAPP");

// ✅ HTTP test function
export const myFunction = onRequest(async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    await db.collection("deployment_test").doc("lastDeploy").set({
      status: "Function working",
      timestamp,
    });
    res.send(`✅ Function deployed successfully at ${timestamp}`);
  } catch (error) {
    console.error("myFunction error:", error);
    res.status(500).send("❌ Error writing to Firestore.");
  }
});

// ✅ Firestore trigger to notify admin doctor when question is submitted
export const notifyOnQuestion = onDocumentCreated(
  {
    document: "questions/{questionId}",
    secrets: [
      SENDGRID_API_KEY,
      SENDGRID_SENDER,
      TWILIO_SID,
      TWILIO_TOKEN,
      TWILIO_WHATSAPP,
    ],
  },
  async (event) => {
    const data = event.data?.data();

    if (!data?.uid || !data?.content) {
      console.warn("Missing uid or content in document");
      return;
    }

    const userUid = data.uid;
    const message = data.content;

    try {
      const userSnap = await db.collection("users").doc(userUid).get();
      if (!userSnap.exists) {
        console.warn("User not found:", userUid);
        return;
      }

      const user = userSnap.data() as {
        email?: string;
        mobile?: string;
        isAdmin?: boolean;
      };

      if (!user.isAdmin) {
        console.warn("User is not an admin:", userUid);
        return;
      }

      // ✅ Send Email
      if (user.email) {
        sendgrid.setApiKey(process.env.SENDGRID_API_KEY!);
        await sendgrid.send({
          to: user.email,
          from: process.env.SENDGRID_SENDER!,
          subject: "💬 New Patient Question",
          text: `You have a new question:\n\n${message}`,
        });
        console.log("Email sent to", user.email);
      }

      // ✅ Send WhatsApp
      if (user.mobile) {
        const client = twilio(
          process.env.TWILIO_SID!,
          process.env.TWILIO_TOKEN!
        );
        await client.messages.create({
          body: `🫞 New patient question:\n\n${message}`,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP!}`,
          to: `whatsapp:${user.mobile}`,
        });
        console.log("WhatsApp sent to", user.mobile);
      }

      console.log("✅ Notification sent to admin user:", userUid);
    } catch (error) {
      console.error("❌ Failed to send notifications:", error);
    }
  }
);