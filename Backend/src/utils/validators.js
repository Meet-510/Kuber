import { z } from 'zod';
import { badRequest } from './errors.js';

// ── Reusable field schemas ────────────────────────────────────────────────────
const email = z.string().trim().toLowerCase().email('Please enter a valid email address');
const money = z
  .number({ invalid_type_error: 'Amount must be a number' })
  .finite('Amount must be a number')
  .positive('Amount must be greater than 0')
  .max(1_000_000, 'Amount exceeds the maximum limit');

// ── Mutation input schemas ────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name is too long'),
  email,
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const transferSchema = z.object({
  recipientEmail: email,
  amount: money,
  message: z.string().max(140, 'Message is too long').optional().default(''),
});

export const createGoalSchema = z.object({
  name: z.string().trim().min(1, 'Goal name is required').max(80),
  targetAmount: money.max(10_000_000, 'Target is too large'),
  // Accept an ISO date or date-time string (or null); parsed with new Date() later.
  deadline: z.string().min(1).nullish(),
  color: z.string().max(20).optional(),
  icon: z.string().max(8).optional(),
});

export const addToGoalSchema = z.object({
  goalId: z.string().min(1),
  amount: money,
});

/**
 * Parse `data` against `schema`, throwing a GraphQL BAD_USER_INPUT error
 * (with the first human-readable message) on failure.
 */
export const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) throw badRequest(result.error.issues[0].message);
  return result.data;
};
