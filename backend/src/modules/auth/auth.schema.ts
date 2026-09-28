import { z } from 'zod';
import { env } from '../../config/env';

const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const password = z.string().min(8, 'Password must be at least 8 characters');

export const registerSchema = z.object({ email, password });
export const loginSchema = z.object({ email, password });
export const resendOtpSchema = z.object({ email });

export const verifyOtpSchema = z.object({
  email,
  code: z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{${env.OTP_LENGTH}}$`), `Code must be ${env.OTP_LENGTH} digits`),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
