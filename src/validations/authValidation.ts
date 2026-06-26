import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    photoURL: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'ID token is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});
