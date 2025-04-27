import { config } from "dotenv";
config();

console.log("SENDGRID_API_KEY:", process.env.SENDGRID_API_KEY);
console.log("Starts with:", process.env.SENDGRID_API_KEY?.slice(0, 3));