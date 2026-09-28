import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  // Indian mobile numbers: 10 digits, first digit 6-9. The +91 country code is
  // implied/fixed for this assignment rather than stored per-user.
  mobileNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  address: z.string().trim().min(5, 'Address must be at least 5 characters').max(300),
  businessName: z
    .string()
    .trim()
    .max(150)
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? value : undefined)),
});

export type ProfileInput = z.infer<typeof profileSchema>;
