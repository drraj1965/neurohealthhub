import { auth, db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

interface EmailNotificationData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface WhatsAppNotificationData {
  to: string;
  body: string;
}

// Send email notification
export async function sendEmailNotification(data: EmailNotificationData) {
  try {
    // In a real implementation, we would call a cloud function 
    // that uses SendGrid to send the email
    await addDoc(collection(db, "mail"), {
      to: data.to,
      message: {
        subject: data.subject,
        text: data.text,
        html: data.html,
      },
    });
    return true;
  } catch (error) {
    console.error("Email notification error:", error);
    return false;
  }
}

// Send WhatsApp notification
export async function sendWhatsAppNotification(data: WhatsAppNotificationData) {
  try {
    // In a real implementation, we would call a cloud function 
    // that uses Twilio to send the WhatsApp message
    await addDoc(collection(db, "twilio"), {
      to: data.to,
      body: data.body,
    });
    return true;
  } catch (error) {
    console.error("WhatsApp notification error:", error);
    return false;
  }
}
