import { 
  users, type User, type InsertUser,
  doctors, type Doctor, type InsertDoctor,
  questions, type Question, type InsertQuestion,
  answers, type Answer, type InsertAnswer
} from "@shared/schema";

// Storage interface for all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Doctor operations
  getDoctor(id: number): Promise<Doctor | undefined>;
  getDoctorByEmail(email: string): Promise<Doctor | undefined>;
  getDoctorByUsername(username: string): Promise<Doctor | undefined>;
  getAllDoctors(): Promise<Doctor[]>;
  
  // Question operations
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsByUser(userId: number): Promise<Question[]>;
  getQuestionsByDoctor(doctorId: number): Promise<Question[]>;
  getPublicQuestions(): Promise<Question[]>;
  getTodaysQuestionsByUser(userId: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<Question>): Promise<Question | undefined>;
  
  // Answer operations
  getAnswer(id: number): Promise<Answer | undefined>;
  getAnswersByQuestion(questionId: number): Promise<Answer[]>;
  createAnswer(answer: InsertAnswer): Promise<Answer>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private doctors: Map<number, Doctor>;
  private questions: Map<number, Question>;
  private answers: Map<number, Answer>;
  private userIdCounter: number;
  private doctorIdCounter: number;
  private questionIdCounter: number;
  private answerIdCounter: number;

  constructor() {
    this.users = new Map();
    this.doctors = new Map();
    this.questions = new Map();
    this.answers = new Map();
    this.userIdCounter = 1;
    this.doctorIdCounter = 1;
    this.questionIdCounter = 1;
    this.answerIdCounter = 1;
    
    // Initialize with predefined doctors from the specs
    this.initializeDoctors();
    // Initialize with one predefined user
    this.initializeUser();
  }

  private initializeDoctors() {
    const predefinedDoctors: InsertDoctor[] = [
      {
        email: "doctornerves@gmail.com",
        mobile: "+971501802970",
        firstName: "Dr. Rajshekher",
        lastName: "Garikapati",
        isAdmin: true,
        username: "doctornerves",
      },
      {
        email: "ponnusankar100@gmail.com",
        mobile: "+918547035009",
        firstName: "Dr. Ponnu",
        lastName: "Sankaran Pillai",
        isAdmin: true,
        username: "ponnu",
      },
      {
        email: "dr.ukzain@gmail.com",
        mobile: "+923002220302",
        firstName: "Dr. Rajshekher",
        lastName: "Zain Ul Abedin",
        isAdmin: true,
        username: "ummulkiram",
      }
    ];

    predefinedDoctors.forEach(doctor => {
      const id = this.doctorIdCounter++;
      this.doctors.set(id, { ...doctor, id });
    });
  }

  private initializeUser() {
    const predefinedUser: InsertUser = {
      email: "drphaniraj1965@gmail.com",
      password: "Neurohealthhub@2025", // This would be hashed in a real implementation
      mobile: "+971501802970",
      firstName: "Rajshekher",
      lastName: "Garikapati",
      isAdmin: false,
      username: "Raju Gentleman",
    };

    const id = this.userIdCounter++;
    this.users.set(id, { 
      ...predefinedUser, 
      id, 
      createdAt: new Date()
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  // Doctor operations
  async getDoctor(id: number): Promise<Doctor | undefined> {
    return this.doctors.get(id);
  }

  async getDoctorByEmail(email: string): Promise<Doctor | undefined> {
    return Array.from(this.doctors.values()).find(doctor => doctor.email === email);
  }

  async getDoctorByUsername(username: string): Promise<Doctor | undefined> {
    return Array.from(this.doctors.values()).find(doctor => doctor.username === username);
  }

  async getAllDoctors(): Promise<Doctor[]> {
    return Array.from(this.doctors.values());
  }

  // Question operations
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async getQuestionsByUser(userId: number): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(
      question => question.userId === userId
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getQuestionsByDoctor(doctorId: number): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(
      question => question.doctorId === doctorId
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPublicQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(question => question.isPublic)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTodaysQuestionsByUser(userId: number): Promise<Question[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.questions.values())
      .filter(question => 
        question.userId === userId && 
        question.createdAt >= today
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.questionIdCounter++;
    const now = new Date();
    const question: Question = {
      ...insertQuestion,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.questions.set(id, question);
    return question;
  }

  async updateQuestion(id: number, questionUpdate: Partial<Question>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const updatedQuestion: Question = {
      ...question,
      ...questionUpdate,
      updatedAt: new Date()
    };
    
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  // Answer operations
  async getAnswer(id: number): Promise<Answer | undefined> {
    return this.answers.get(id);
  }

  async getAnswersByQuestion(questionId: number): Promise<Answer[]> {
    return Array.from(this.answers.values())
      .filter(answer => answer.questionId === questionId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createAnswer(insertAnswer: InsertAnswer): Promise<Answer> {
    const id = this.answerIdCounter++;
    const answer: Answer = {
      ...insertAnswer,
      id,
      createdAt: new Date()
    };
    this.answers.set(id, answer);
    return answer;
  }
}

export const storage = new MemStorage();
