import { z } from "zod";

export const registerSchema = z.object({
    email: z.string().email({ message: "Email is required and must be valid" }),
    password: z.string().min(8, { message: "Password is required and must be at least 8 characters" }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: "Email is required and must be valid" }),
  password: z.string().min(8, { message: "Password is required and must be at least 8 characters" }),
});