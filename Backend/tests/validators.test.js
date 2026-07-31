import { describe, it, expect } from 'vitest';
import {
  validate,
  transferSchema,
  emailOnlySchema,
  loginSchema,
  verifyRegisterSchema,
  resetPasswordSchema,
} from '../src/utils/validators.js';

describe('transferSchema', () => {
  it('normalizes the recipient email (trim + lowercase)', () => {
    const out = validate(transferSchema, {
      recipientEmail: '  Alice@Example.COM ',
      amount: 50,
    });
    expect(out.recipientEmail).toBe('alice@example.com');
    expect(out.message).toBe('');
  });

  it('rejects a zero or negative amount', () => {
    expect(() => validate(transferSchema, { recipientEmail: 'a@b.com', amount: 0 })).toThrow(
      /greater than 0/
    );
    expect(() => validate(transferSchema, { recipientEmail: 'a@b.com', amount: -5 })).toThrow(
      /greater than 0/
    );
  });

  it('rejects a non-finite amount', () => {
    expect(() =>
      validate(transferSchema, { recipientEmail: 'a@b.com', amount: Infinity })
    ).toThrow();
  });

  it('rejects a malformed email', () => {
    expect(() => validate(transferSchema, { recipientEmail: 'not-an-email', amount: 5 })).toThrow(
      /valid email/
    );
  });
});

describe('auth validators', () => {
  it('emailOnlySchema normalizes and rejects bad emails', () => {
    expect(validate(emailOnlySchema, { email: 'A@B.com ' }).email).toBe('a@b.com');
    expect(() => validate(emailOnlySchema, { email: 'nope' })).toThrow(/valid email/);
  });

  it('loginSchema requires a non-empty password', () => {
    expect(() => validate(loginSchema, { email: 'a@b.com', password: '' })).toThrow(/required/);
    expect(validate(loginSchema, { email: 'a@b.com', password: 'x' }).email).toBe('a@b.com');
  });

  it('verifyRegisterSchema requires name + 6-digit code + strong password', () => {
    const good = { email: 'a@b.com', name: 'A', password: 'secret123', code: '123456' };
    expect(validate(verifyRegisterSchema, good).code).toBe('123456');
    expect(() => validate(verifyRegisterSchema, { ...good, code: 'abcdef' })).toThrow(/6-digit/);
    expect(() => validate(verifyRegisterSchema, { ...good, password: '123' })).toThrow(/at least 6/);
    expect(() => validate(verifyRegisterSchema, { ...good, name: '   ' })).toThrow(/Name is required/);
  });

  it('resetPasswordSchema requires id + token + strong password', () => {
    expect(() =>
      validate(resetPasswordSchema, { id: '1', token: 't', password: '123' })
    ).toThrow(/at least 6/);
    expect(
      validate(resetPasswordSchema, { id: '1', token: 't', password: 'new-secret' }).password
    ).toBe('new-secret');
  });
});
