import { z } from 'zod';
import { badRequest } from './errors.js';

// ── Reusable field schemas ────────────────────────────────────────────────────
const email = z.string().trim().toLowerCase().email('Please enter a valid email address');
const password = z.string().min(6, 'Password must be at least 6 characters').max(128);
const money = z
  .number({ invalid_type_error: 'Amount must be a number' })
  .finite('Amount must be a number')
  .positive('Amount must be greater than 0')
  .max(1_000_000, 'Amount exceeds the maximum limit');
const otpCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit code');

// ── Mutation input schemas ────────────────────────────────────────────────────
export const emailOnlySchema = z.object({ email });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

// Register step 1 — request an OTP; the user has already picked a password.
// We validate both together so a weak password is caught before we email a code.
export const requestRegisterSchema = z.object({
  email,
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name is too long'),
  password,
});

// Register step 2 — verify the OTP + create the user. Everything comes back
// together so account creation is a single atomic step (no half-verified rows).
export const verifyRegisterSchema = requestRegisterSchema.extend({ code: otpCode });

export const resetPasswordSchema = z.object({
  id: z.string().min(1),
  token: z.string().min(1),
  password,
});

export const transferSchema = z.object({
  recipientEmail: email,
  amount: money,
  message: z.string().max(140, 'Message is too long').optional().default(''),
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
