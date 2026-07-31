import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import OtpChallenge from '../models/OtpChallenge.js';
import { badRequest } from '../utils/errors.js';

// OTPs are 6-digit numeric — long enough to be un-guessable at our rate limits
// (5 attempts, 10-min window) and short enough to be human-typable.
const CODE_LENGTH = 6;
const TTL_MS = 10 * 60 * 1000;
const MIN_RESEND_INTERVAL_MS = 30 * 1000;

// Dev-only in-memory register of the most recent plaintext code per
// (email, purpose). The persisted challenge only stores a bcrypt hash, so
// there's no way to recover the code once issued — this Map exists purely so
// `_devPeekOtp` can surface it in-app when SMTP isn't configured.
// Populated only when NODE_ENV=development; never read in production.
const devCodeStore = new Map();
const devKey = (email, purpose) => `${email}|${purpose}`;
export const _peekDevOtp = ({ email, purpose }) =>
  devCodeStore.get(devKey(email.toLowerCase().trim(), purpose)) || null;

const generateCode = () => {
  // crypto.randomInt is uniform; String.padStart keeps leading zeros.
  const n = crypto.randomInt(0, 10 ** CODE_LENGTH);
  return String(n).padStart(CODE_LENGTH, '0');
};

/**
 * Issue a fresh OTP for (email, purpose). Prior un-consumed challenges for the
 * same pair are invalidated so only the newest code works — this prevents
 * replay of a stale code the user may have received earlier.
 * Returns the plaintext code (to be delivered by email) plus the DB row.
 */
export const issueOtp = async ({ email, purpose }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Simple resend cooldown per (email, purpose): stops accidental spam and
  // reduces the attack surface for enumeration timing.
  const recent = await OtpChallenge.findOne({
    email: normalizedEmail,
    purpose,
    createdAt: { $gt: new Date(Date.now() - MIN_RESEND_INTERVAL_MS) },
  }).lean();
  if (recent) {
    const wait = Math.ceil(
      (MIN_RESEND_INTERVAL_MS - (Date.now() - new Date(recent.createdAt).getTime())) / 1000
    );
    throw badRequest(`Please wait ${wait}s before requesting another code.`);
  }

  // Invalidate any older un-consumed codes for this (email, purpose).
  await OtpChallenge.deleteMany({ email: normalizedEmail, purpose, consumedAt: null });

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  await OtpChallenge.create({
    email: normalizedEmail,
    purpose,
    codeHash,
    expiresAt: new Date(Date.now() + TTL_MS),
  });

  if (process.env.NODE_ENV === 'development') {
    devCodeStore.set(devKey(normalizedEmail, purpose), code);
  }

  return { code };
};

/**
 * Verify a submitted code. Consumes the challenge on success so a code is
 * strictly single-use. Decrements attempts on failure; after 5 wrong tries
 * the challenge is invalidated (the user must request a fresh code).
 */
export const verifyOtp = async ({ email, purpose, code }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const challenge = await OtpChallenge.findOne({
    email: normalizedEmail,
    purpose,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!challenge) throw badRequest('This code has expired. Request a new one.');

  const ok = await bcrypt.compare(String(code), challenge.codeHash);
  if (!ok) {
    challenge.attemptsLeft -= 1;
    if (challenge.attemptsLeft <= 0) {
      await challenge.deleteOne();
      throw badRequest('Too many wrong attempts. Request a new code.');
    }
    await challenge.save();
    throw badRequest(`Incorrect code. ${challenge.attemptsLeft} attempts left.`);
  }

  challenge.consumedAt = new Date();
  await challenge.save();

  if (process.env.NODE_ENV === 'development') {
    devCodeStore.delete(devKey(normalizedEmail, purpose));
  }
};

// Testing hook — never in production.
export const _internal = { generateCode };
