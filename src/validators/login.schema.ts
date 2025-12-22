import { z } from 'zod';
import { messages } from '@/config/messages';

// form zod validation schema
export const loginSchema = z.object({
  email: z.string().min(1, { message: messages.emailIsRequired }).email({ message: messages.invalidEmail }),
  password: z.string().min(1, { message: messages.passwordRequired }),
  rememberMe: z.boolean(),
});

// generate form types from zod validation schema
export type LoginSchema = z.infer<typeof loginSchema>;
