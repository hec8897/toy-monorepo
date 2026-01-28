import { z } from 'zod';
import { UserSchema } from './user';

// Login Request
export const LoginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// Login Response
export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  user: UserSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
