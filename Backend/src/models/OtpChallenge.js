import mongoose from 'mongoose';

// One-time-code challenges for passwordless auth. The plaintext code is never
// stored — only a bcrypt hash — so a DB leak can't grant login. Purpose is
// tagged so a REGISTER code can't be replayed to log in and vice versa.
const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ['LOGIN', 'REGISTER'], required: true },
    attemptsLeft: { type: Number, default: 5 },
    consumedAt: { type: Date, default: null },
    // Mongo auto-deletes the row at this instant (TTL index below).
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

otpSchema.index({ email: 1, purpose: 1, createdAt: -1 });
// TTL: rows are dropped ~60s after expiresAt (background sweep interval).
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('OtpChallenge', otpSchema);
