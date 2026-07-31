import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { IDLE_MS } from '../services/sessionService.js';
import { authError } from '../utils/errors.js';

/**
 * Resolve a request to a user (or null) by validating the bearer token AND
 * its backing session. Returns null if the token is bad, the session was
 * revoked (logout), or the session is idle-expired (>IDLE_MS since last hit).
 * As a side effect, refreshes `lastSeenAt` on a valid session.
 */
export const getUserFromToken = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }

  const { jti, userId } = decoded;
  if (!jti || !userId) return null;

  const session = await Session.findOne({ jti });
  if (!session) return null; // logged out / revoked

  // Server-side inactivity: quietly delete the stale session so the token
  // can never be used again, even if the client keeps sending it.
  if (Date.now() - new Date(session.lastSeenAt).getTime() > IDLE_MS) {
    await session.deleteOne();
    return null;
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    // User was deleted — clean up their sessions too.
    await session.deleteOne();
    return null;
  }

  // Fire-and-forget: don't block the request on the write.
  Session.updateOne({ _id: session._id }, { lastSeenAt: new Date() }).catch(() => {});

  // Attach the jti so resolvers (logout) can revoke this specific session.
  return { ...user, jti };
};

export const requireAuth = (user) => {
  if (!user) throw authError();
  return user;
};
