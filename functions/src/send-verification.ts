import { onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

const EMAIL_USER = defineSecret("EMAIL_USER");
const EMAIL_PASS = defineSecret("EMAIL_PASS");

// Remove admin.initializeApp()
import { db } from "./firebase-admin";  // Only if you use Firestore or Auth

export const sendVerificationEmail = onCall(
  {
    secrets: [EMAIL_USER, EMAIL_PASS],
    region: "me-central1",
  },
  async (request) => {
    const { email, verificationLink } = request.data;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER!,
        pass: process.env.EMAIL_PASS!,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER!,
      to: email,
      subject: "Verify Your Email - NeuroHealthHub",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">NeuroHealthHub Email Verification</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #3182ce; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; font-weight: bold;">
              Verify My Email
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${verificationLink}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw new Error("Internal error sending email");
    }
  }
);