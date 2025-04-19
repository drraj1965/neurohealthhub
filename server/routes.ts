import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { sendEmail, sendWhatsApp } from "./notifications";
import { 
  insertUserSchema, 
  loginSchema, 
  insertQuestionSchema,
  insertAnswerSchema 
} from "@shared/schema";

// Import Firebase Admin functions
import { 
  getFirebaseAuthUsers, 
  getFirebaseAuthUserByUid, 
  getFirebaseAuthUserByEmail,
  createFirebaseAuthUser,
  updateFirebaseAuthUser,
  deleteFirebaseAuthUser,
  sendVerificationEmail,
  generateEmailVerificationLink,
  initializeFirebaseAdmin
} from './firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Firebase Admin SDK
  try {
    initializeFirebaseAdmin();
    console.log('Firebase Admin SDK initialized in routes');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK in routes:', error);
  }

  // API routes
  app.get("/api/doctors", async (req: Request, res: Response) => {
    try {
      const doctors = await storage.getAllDoctors();
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  // User registration
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // In a real implementation, we would hash the password here
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // User login - in reality this would be handled by Firebase Auth
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const loginData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(loginData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // In a real implementation, we would verify the hashed password here
      if (user.password !== loginData.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        user: userWithoutPassword,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Submit a question
  app.post("/api/questions", async (req: Request, res: Response) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUser(questionData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if doctor exists
      const doctor = await storage.getDoctor(questionData.doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      const question = await storage.createQuestion(questionData);
      
      // Send notifications
      if (doctor.email) {
        await sendEmail({
          to: doctor.email,
          subject: `New Question: ${question.title}`,
          text: `You have received a new question: ${question.title}.\n\nQuestion: ${question.content}\n\nPlease log in to respond.`,
          html: `<h3>You have received a new question</h3><p><strong>Title:</strong> ${question.title}</p><p><strong>Question:</strong> ${question.content}</p><p>Please <a href="#">log in</a> to respond.</p>`
        });
      }
      
      if (doctor.mobile) {
        await sendWhatsApp({
          to: doctor.mobile,
          body: `You have received a new question: ${question.title}. Please log in to respond.`
        });
      }
      
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid question data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  // Get questions for a user
  app.get("/api/users/:userId/questions", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const questions = await storage.getQuestionsByUser(userId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Get today's questions for a user
  app.get("/api/users/:userId/questions/today", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const questions = await storage.getTodaysQuestionsByUser(userId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's questions" });
    }
  });

  // Get questions for a doctor
  app.get("/api/doctors/:doctorId/questions", async (req: Request, res: Response) => {
    try {
      const doctorId = parseInt(req.params.doctorId);
      
      if (isNaN(doctorId)) {
        return res.status(400).json({ message: "Invalid doctor ID" });
      }
      
      const questions = await storage.getQuestionsByDoctor(doctorId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Get public questions
  app.get("/api/questions/public", async (req: Request, res: Response) => {
    try {
      const questions = await storage.getPublicQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch public questions" });
    }
  });

  // Submit an answer
  app.post("/api/questions/:questionId/answers", async (req: Request, res: Response) => {
    try {
      const questionId = parseInt(req.params.questionId);
      
      if (isNaN(questionId)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }
      
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      const answerData = insertAnswerSchema.parse({
        ...req.body,
        questionId
      });
      
      const answer = await storage.createAnswer(answerData);
      
      // If it's a doctor's answer, notify the user
      if (answerData.doctorId) {
        const user = await storage.getUser(question.userId);
        const doctor = await storage.getDoctor(answerData.doctorId);
        
        if (user && user.email && doctor) {
          await sendEmail({
            to: user.email,
            subject: `Your question has been answered by Dr. ${doctor.lastName}`,
            text: `Your question "${question.title}" has been answered.\n\nAnswer: ${answer.content}\n\nPlease log in to view the complete response.`,
            html: `<h3>Your question has been answered</h3><p><strong>Question:</strong> ${question.title}</p><p><strong>Answer:</strong> ${answer.content}</p><p>Please <a href="#">log in</a> to view the complete response.</p>`
          });
        }
      }
      
      res.status(201).json(answer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid answer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create answer" });
    }
  });

  // Get answers for a question
  app.get("/api/questions/:questionId/answers", async (req: Request, res: Response) => {
    try {
      const questionId = parseInt(req.params.questionId);
      
      if (isNaN(questionId)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }
      
      const answers = await storage.getAnswersByQuestion(questionId);
      res.json(answers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch answers" });
    }
  });

  // Make a question public
  app.patch("/api/questions/:questionId/public", async (req: Request, res: Response) => {
    try {
      const questionId = parseInt(req.params.questionId);
      
      if (isNaN(questionId)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }
      
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      const updatedQuestion = await storage.updateQuestion(questionId, { isPublic: true });
      res.json(updatedQuestion);
    } catch (error) {
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  // FIREBASE AUTH API ENDPOINTS
  
  // Get all Firebase Auth users
  app.get("/api/firebase-auth/users", async (req: Request, res: Response) => {
    try {
      const users = await getFirebaseAuthUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching Firebase Auth users:", error);
      res.status(500).json({ message: "Failed to fetch Firebase Auth users" });
    }
  });
  
  // Get a Firebase Auth user by UID
  app.get("/api/firebase-auth/users/:uid", async (req: Request, res: Response) => {
    try {
      const { uid } = req.params;
      const user = await getFirebaseAuthUserByUid(uid);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching Firebase Auth user:", error);
      res.status(500).json({ message: "Failed to fetch Firebase Auth user" });
    }
  });
  
  // Get a Firebase Auth user by email
  app.get("/api/firebase-auth/users/email/:email", async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      const user = await getFirebaseAuthUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching Firebase Auth user by email:", error);
      res.status(500).json({ message: "Failed to fetch Firebase Auth user" });
    }
  });
  
  // Create a new Firebase Auth user
  app.post("/api/firebase-auth/users", async (req: Request, res: Response) => {
    try {
      const { email, password, displayName, phoneNumber } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await createFirebaseAuthUser({
        email,
        password,
        displayName,
        phoneNumber
      });
      
      if (!user) {
        return res.status(500).json({ message: "Failed to create user" });
      }
      
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating Firebase Auth user:", error);
      res.status(500).json({ message: "Failed to create Firebase Auth user" });
    }
  });
  
  // Update a Firebase Auth user
  app.patch("/api/firebase-auth/users/:uid", async (req: Request, res: Response) => {
    try {
      const { uid } = req.params;
      const { email, password, displayName, phoneNumber, disabled } = req.body;
      
      const user = await updateFirebaseAuthUser(uid, {
        email,
        password,
        displayName,
        phoneNumber,
        disabled
      });
      
      if (!user) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating Firebase Auth user:", error);
      res.status(500).json({ message: "Failed to update Firebase Auth user" });
    }
  });
  
  // Delete a Firebase Auth user
  app.delete("/api/firebase-auth/users/:uid", async (req: Request, res: Response) => {
    try {
      const { uid } = req.params;
      const success = await deleteFirebaseAuthUser(uid);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete user" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting Firebase Auth user:", error);
      res.status(500).json({ message: "Failed to delete Firebase Auth user" });
    }
  });
  
  // Send verification email to a user
  app.post("/api/firebase-auth/users/:uid/send-verification-email", async (req: Request, res: Response) => {
    try {
      const { uid } = req.params;
      console.log(`Sending verification email to user with UID: ${uid}`);
      
      // Get the link directly from generateEmailVerificationLink function
      const verificationLink = await generateEmailVerificationLink(uid);
      
      if (!verificationLink) {
        return res.status(500).json({ success: false, message: "Failed to generate verification link" });
      }
      
      // Try to send the email, but don't fail if it doesn't work
      try {
        // Get the user record to get the email
        const auth = getAuth();
        const userRecord = await auth.getUser(uid);
        
        if (userRecord && userRecord.email) {
          // Format a nice HTML email with the verification link
          const userDisplayName = userRecord.displayName || userRecord.email.split('@')[0];
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4a5568;">NeuroHealthHub Email Verification</h2>
              <p>Hello ${userDisplayName},</p>
              <p>Thank you for registering with NeuroHealthHub. Please verify your email address by clicking the button below:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify My Email</a>
              </div>
              <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #4a5568;"><a href="${verificationLink}">${verificationLink}</a></p>
              <p>This link will expire in 24 hours.</p>
              <p>If you did not create an account with NeuroHealthHub, you can safely ignore this email.</p>
              <p>Best regards,<br>The NeuroHealthHub Team</p>
            </div>
          `;
          
          // Send the email
          await sendEmail({
            to: userRecord.email,
            subject: 'Verify Your NeuroHealthHub Email Address',
            text: `Hello ${userDisplayName}, please verify your email by clicking this link: ${verificationLink}`,
            html: emailHtml
          });
          
          console.log(`Verification email sent to ${userRecord.email}`);
        }
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
        // We don't fail the request if the email sending fails
      }
      
      // Always return the verification link to the client
      res.json({ 
        success: true, 
        message: "Verification link generated successfully",
        verificationLink: verificationLink
      });
    } catch (error) {
      console.error("Error processing verification request:", error);
      res.status(500).json({ success: false, message: "Failed to process verification request" });
    }
  });
  
  // Send verification email to a user by email address
  app.post("/api/firebase-auth/users/email/:email/send-verification", async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      
      if (!email) {
        return res.status(400).json({ error: "Email address is required" });
      }
      
      console.log(`Attempting to send verification email to address: ${email}`);
      
      // Find the user by email
      const userRecord = await getFirebaseAuthUserByEmail(email);
      
      if (!userRecord) {
        return res.status(404).json({ error: "User not found with this email address" });
      }
      
      // Get the link directly from generateEmailVerificationLink function
      const verificationLink = await generateEmailVerificationLink(userRecord.uid);
      
      if (!verificationLink) {
        return res.status(500).json({ success: false, message: "Failed to generate verification link" });
      }
      
      // Format a nice HTML email with the verification link
      const userDisplayName = userRecord.displayName || email.split('@')[0];
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">NeuroHealthHub Email Verification</h2>
          <p>Hello ${userDisplayName},</p>
          <p>Thank you for registering with NeuroHealthHub. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify My Email</a>
          </div>
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4a5568;"><a href="${verificationLink}">${verificationLink}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account with NeuroHealthHub, you can safely ignore this email.</p>
          <p>Best regards,<br>The NeuroHealthHub Team</p>
        </div>
      `;
      
      // Send the email
      try {
        await sendEmail({
          to: email,
          subject: 'Verify Your NeuroHealthHub Email Address',
          text: `Hello ${userDisplayName}, please verify your email by clicking this link: ${verificationLink}`,
          html: emailHtml
        });
        
        console.log(`Verification email sent to ${email}`);
        
        return res.json({ 
          success: true, 
          message: "Verification email sent successfully",
          verificationLink: verificationLink // Include the link for testing
        });
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to send verification email, but link was generated",
          verificationLink: verificationLink // Include the link so client can use it anyway
        });
      }
    } catch (error) {
      console.error("Error processing verification request:", error);
      return res.status(500).json({ success: false, message: "Failed to process verification request" });
    }
  });

  // Manual endpoint to create a user record in Firestore
  app.post("/api/firebase-auth/manual-create-user", async (req: Request, res: Response) => {
    try {
      const { uid, email, firstName, lastName } = req.body;
      
      if (!uid || !email) {
        return res.status(400).json({ error: "User ID and email are required" });
      }
      
      console.log(`Manual request to create user in Firestore: ${uid} (${email})`);
      
      // Import the helper function
      const { createFirestoreUserRecord } = await import('./manualUserCreation');
      
      // Call the function to create the user
      const result = await createFirestoreUserRecord(uid, email, firstName, lastName);
      
      if (result.success) {
        return res.status(result.status === 'created' ? 201 : 200).json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error) {
      console.error("Error in manual user creation endpoint:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Server error during manual user creation",
        error: error.message
      });
    }
  });
  
  // Special endpoint to handle custom email verification and adding verified users to Firestore database
  app.post("/api/firebase-auth/users/verified", async (req: Request, res: Response) => {
    try {
      const { uid, email, temporaryData } = req.body;
      
      if (!uid) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      console.log(`Processing verified user with UID: ${uid}`);
      
      // Initialize Firebase Admin
      initializeFirebaseAdmin();
      const auth = getAuth();
      
      // Get user record
      const userRecord = await auth.getUser(uid);
      
      if (!userRecord) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if the user's email is already verified - if not, we won't continue
      if (!userRecord.emailVerified) {
        console.log(`Email not verified for user ${uid}, not adding to Firestore yet`);
        return res.status(400).json({ error: "Email not verified" });
      }
      
      console.log(`User ${uid} email is verified, proceeding to add to Firestore if needed`);
      
      // Get Firestore instance
      const firestore = getFirestore();
      
      // Check if user already exists in Firestore
      const userDoc = await firestore.collection('users').doc(uid).get();
      
      if (userDoc.exists) {
        return res.status(200).json({ 
          message: "User already exists in Firestore",
          status: "existing"
        });
      }
      
      // Prepare user data with information from both user record and temporary data
      const userData = {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || null,
        firstName: temporaryData?.firstName || 
          (userRecord.displayName ? userRecord.displayName.split(' ')[0] : null),
        lastName: temporaryData?.lastName || 
          (userRecord.displayName ? userRecord.displayName.split(' ').slice(1).join(' ') : null),
        username: temporaryData?.username || 
          (userRecord.email ? userRecord.email.split('@')[0] : null),
        mobile: temporaryData?.mobile || null,
        photoURL: userRecord.photoURL || null,
        phoneNumber: userRecord.phoneNumber || null,
        isAdmin: false, // New users are not admins by default
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        emailVerified: true, // We only add verified users
      };
      
      // Add user to Firestore
      await firestore.collection('users').doc(uid).set(userData);
      
      console.log(`User ${uid} successfully added to Firestore after email verification`);
      
      return res.status(201).json({
        message: "User successfully added to Firestore",
        status: "created"
      });
      
    } catch (error) {
      console.error("Error adding verified user to Firestore:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
