import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';

// Server-enforced idle window. If a session has had no authenticated request
// for this long, it is treated as expired and revoked — a stolen token
// becomes worthless within IDLE_MS of the last legitimate use.
export const IDLE_MS = 5 * 60 * 1000;
// Absolute max session lifetime — even an actively-used session must
// re-authenticate after this. Matches the JWT `exp` we sign below.
const MAX_LIFETIME = '7d';

/**
 * Mint a JWT + create the backing Session row. The JWT carries the session's
 * `jti`; the middleware refuses any token whose session is missing or stale,
 * which is what makes logout / idle-timeout actually revoke the token.
 */
export const createSession = async ({ userId, userAgent = '', ip = '' }) => {
  const jti = randomUUID();
  await Session.create({ userId, jti, userAgent, ip });
  // `jwtid` puts jti into the standard `jti` claim — don't also set it in the
  // payload, jsonwebtoken rejects the collision.
  const token = jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: MAX_LIFETIME,
    jwtid: jti,
  });
  return { token, jti };
};

export const revokeSession = (jti) => Session.deleteOne({ jti });

export const revokeAllSessionsForUser = (userId) => Session.deleteMany({ userId });
