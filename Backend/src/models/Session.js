import mongoose from 'mongoose';

// One row per issued JWT — the JWT carries a `jti` that points here. This is
// what lets us revoke a token server-side (logout, admin kill, idle timeout):
// the auth middleware refuses any request whose session is missing or stale.
const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jti: { type: String, required: true, unique: true },
    // Bumped by every authenticated request; if now - lastSeenAt > IDLE window,
    // the middleware treats the session as expired (server-side inactivity).
    lastSeenAt: { type: Date, default: Date.now },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Session', sessionSchema);
