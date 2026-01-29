import { z } from 'zod';

// Role enum
export const RoleSchema = z.enum(['user', 'admin']);
export type Role = z.infer<typeof RoleSchema>;

// User
export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  role: RoleSchema,
});
export type User = z.infer<typeof UserSchema>;
