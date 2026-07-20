import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password too long'),
});

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createRoomSchema = z.object({
  name: z
    .string()
    .min(3, 'Room name must be at least 3 characters')
    .max(30, 'Room name must be at most 30 characters'),
  description: z.string().max(100, 'Description must be at most 100 characters').optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  type: z.enum(['text', 'image']).optional().default('text'),
});

export const searchUserSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const sendRequestSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
});

export const updateRequestSchema = z.object({
  status: z.enum(['accepted', 'rejected'], {
    error: 'Status must be accepted or rejected',
  }),
});

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores')
    .optional(),
  bio: z.string().max(150, 'Bio must be at most 150 characters').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type SearchUserInput = z.infer<typeof searchUserSchema>;
export type SendRequestInput = z.infer<typeof sendRequestSchema>;
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
