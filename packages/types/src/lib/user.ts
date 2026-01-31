import { z } from 'zod';

// Role enum
export const RoleSchema = z.enum(['user', 'admin']);
export type Role = z.infer<typeof RoleSchema>;

// Role constants (from Zod schema)
export const RoleValues = RoleSchema.enum;

// User
export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  email: z.string(),
  role: RoleSchema,
});
export type User = z.infer<typeof UserSchema>;
