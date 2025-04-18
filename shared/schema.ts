import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  mobile: text("mobile"),
  isAdmin: boolean("isAdmin").default(false).notNull(),
  username: text("username").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Doctors (admins) schema
export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  mobile: text("mobile"),
  username: text("username").notNull().unique(),
  isAdmin: boolean("isAdmin").default(true).notNull(),
});

export const insertDoctorSchema = createInsertSchema(doctors).omit({
  id: true,
});

// Questions schema
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  doctorId: integer("doctorId").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  questionType: text("questionType").notNull(),
  attachments: json("attachments").$type<string[]>(),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Answers schema
export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  questionId: integer("questionId").notNull(),
  userId: integer("userId"),
  doctorId: integer("doctorId"),
  content: text("content").notNull(),
  attachments: json("attachments").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const insertAnswerSchema = createInsertSchema(answers).omit({
  id: true,
  createdAt: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;

// Firebase user schema for client-side
export const firebaseUserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  mobile: z.string().optional(),
  isAdmin: z.boolean().default(false),
  username: z.string(),
});

export type FirebaseUser = z.infer<typeof firebaseUserSchema>;

// Question form schema
export const questionFormSchema = z.object({
  doctorId: z.string().min(1, "Please select a doctor"),
  questionType: z.string().min(1, "Please select a question type"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Question must be at least 10 characters"),
  attachments: z.array(z.string()).optional(),
});

export type QuestionFormData = z.infer<typeof questionFormSchema>;

// Registration form schema
export const registrationSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  mobile: z.string().optional(),
  terms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions"
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export type RegistrationData = z.infer<typeof registrationSchema>;

// Login form schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export type LoginData = z.infer<typeof loginSchema>;
