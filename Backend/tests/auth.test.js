import { describe, it, expect, vi, beforeEach } from 'vitest';

// Silence email delivery in tests — issueOtp returns the code so we never
// need SMTP to fire.
vi.mock('../src/services/emailService.js', () => ({
  sendOtpEmail: vi.fn().mockResolvedValue({}),
  sendPasswordResetEmail: vi.fn().mockResolvedValue({}),
  sendTransferReceivedEmail: vi.fn().mockResolvedValue({}),
}));

import jwt from 'jsonwebtoken';
import resolvers from '../src/resolvers/index.js';
import User from '../src/models/User.js';
import Session from '../src/models/Session.js';
import { issueOtp } from '../src/services/otpService.js';
import { getUserFromToken } from '../src/middleware/auth.js';
import { IDLE_MS } from '../src/services/sessionService.js';
import { makeUser } from './helpers.js';

const reqFor = (token) => ({ headers: { authorization: token ? `Bearer ${token}` : '' } });

beforeEach(() => {
  process.env.JWT_SECRET ||= 'test-secret-test-secret-test-secret-1234';
});

describe('password login', () => {
  it('returns a JWT + session for a valid email/password', async () => {
    const { user, password } = await makeUser({ email: 'alice@example.com' });
    const { token } = await resolvers.Mutation.loginUser(
      null,
      { email: user.email, password },
      { req: {} }
    );
    const me = await getUserFromToken(reqFor(token));
    expect(me?.email).toBe(user.email);
    expect(me?.jti).toBeTruthy();
  });

  it('rejects a wrong password with a generic message', async () => {
    const { user } = await makeUser({ email: 'bob@example.com' });
    await expect(
      resolvers.Mutation.loginUser(null, { email: user.email, password: 'wrong' }, { req: {} })
    ).rejects.toThrow(/Invalid email or password/);
  });

  it('rejects an unknown email with the same generic message (no enumeration)', async () => {
    await expect(
      resolvers.Mutation.loginUser(null, { email: 'nobody@example.com', password: 'x' }, { req: {} })
    ).rejects.toThrow(/Invalid email or password/);
  });
});

describe('OTP register flow', () => {
  it('rejects a wrong code, then creates the user + account on a correct code', async () => {
    const email = 'new@example.com';
    const args = { email, name: 'New User', password: 'secret123' };
    const { code } = await issueOtp({ email, purpose: 'REGISTER' });

    await expect(
      resolvers.Mutation.verifyRegisterOtp(null, { ...args, code: '000000' }, { req: {} })
    ).rejects.toThrow(/Incorrect code/);
    expect(await User.findOne({ email })).toBeNull();

    const payload = await resolvers.Mutation.verifyRegisterOtp(
      null,
      { ...args, code },
      { req: {} }
    );
    expect(payload.token).toBeTruthy();
    expect(payload.user.email).toBe(email);
    expect(await Session.countDocuments({})).toBe(1);
  });

  it('rejects register for an email that already exists', async () => {
    await makeUser({ email: 'taken@example.com' });
    const { code } = await issueOtp({ email: 'taken@example.com', purpose: 'REGISTER' });
    await expect(
      resolvers.Mutation.verifyRegisterOtp(
        null,
        { email: 'taken@example.com', code, name: 'X', password: 'secret123' },
        { req: {} }
      )
    ).rejects.toThrow(/already in use/);
  });
});

describe('forgot / reset password', () => {
  it('accepts a fresh reset link and sets the new password', async () => {
    const { user } = await makeUser({ email: 'reset@example.com' });
    const fresh = await User.findById(user._id);
    const token = jwt.sign(
      { id: fresh._id.toString(), action: 'password_reset' },
      process.env.JWT_SECRET + fresh.password,
      { expiresIn: '15m' }
    );

    const ok = await resolvers.Mutation.resetPassword(
      null,
      { id: fresh._id.toString(), token, password: 'new-password' },
      {}
    );
    expect(ok).toBe(true);

    // New password logs in, old one doesn't.
    await expect(
      resolvers.Mutation.loginUser(null, { email: fresh.email, password: 'new-password' }, { req: {} })
    ).resolves.toBeTruthy();
    await expect(
      resolvers.Mutation.loginUser(null, { email: fresh.email, password: 'secret123' }, { req: {} })
    ).rejects.toThrow(/Invalid/);
  });

  it('a used link no longer works — signature includes the old password hash', async () => {
    const { user } = await makeUser({ email: 'once@example.com' });
    const fresh = await User.findById(user._id);
    const token = jwt.sign(
      { id: fresh._id.toString(), action: 'password_reset' },
      process.env.JWT_SECRET + fresh.password,
      { expiresIn: '15m' }
    );

    // First reset succeeds.
    await resolvers.Mutation.resetPassword(
      null,
      { id: fresh._id.toString(), token, password: 'first-new' },
      {}
    );

    // Reusing the same token fails — the password (and therefore the signing
    // secret) has changed, so verify() throws.
    await expect(
      resolvers.Mutation.resetPassword(
        null,
        { id: fresh._id.toString(), token, password: 'second-new' },
        {}
      )
    ).rejects.toThrow(/Invalid or expired/);
  });

  it('a tampered token is rejected', async () => {
    const { user } = await makeUser({ email: 'tamper@example.com' });
    const fresh = await User.findById(user._id);
    const bad = jwt.sign(
      { id: fresh._id.toString(), action: 'password_reset' },
      'wrong-secret',
      { expiresIn: '15m' }
    );
    await expect(
      resolvers.Mutation.resetPassword(
        null,
        { id: fresh._id.toString(), token: bad, password: 'x-new-pw' },
        {}
      )
    ).rejects.toThrow(/Invalid or expired/);
  });
});

describe('sessions & inactivity', () => {
  it('logout revokes the session — subsequent requests resolve to null', async () => {
    const { user, password } = await makeUser({ email: 'logout@example.com' });
    const { token } = await resolvers.Mutation.loginUser(
      null,
      { email: user.email, password },
      { req: {} }
    );

    const ctx = await getUserFromToken(reqFor(token));
    expect(ctx?.email).toBe(user.email);

    await resolvers.Mutation.logout(null, {}, { user: ctx });

    expect(await getUserFromToken(reqFor(token))).toBeNull();
    expect(await Session.countDocuments({})).toBe(0);
  });

  it('a session idle beyond IDLE_MS is auto-revoked on next request', async () => {
    const { user, password } = await makeUser({ email: 'idle@example.com' });
    const { token } = await resolvers.Mutation.loginUser(
      null,
      { email: user.email, password },
      { req: {} }
    );
    await Session.updateOne({}, { lastSeenAt: new Date(Date.now() - IDLE_MS - 1000) });
    expect(await getUserFromToken(reqFor(token))).toBeNull();
    expect(await Session.countDocuments({})).toBe(0);
  });
});
