import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    photoURL: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum(['user', 'creator', 'admin'], { message: 'Invalid role' }),
  }),
});
