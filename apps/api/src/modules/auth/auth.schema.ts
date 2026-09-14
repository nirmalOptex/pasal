import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    businessName: z.string().min(2, 'Business name must have at least 2 characters'),
    currency: z.string().default('NPR'),
    name: z.string().min(2, 'Name must have at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional(),
    branchName: z.string().default('Main Branch'),
    branchAddress: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});
