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
  initializeFirebaseAdmin
} from './firebase-admin';

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

  const httpServer = createServer(app);
  return httpServer;
}
