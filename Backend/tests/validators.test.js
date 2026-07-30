import { describe, it, expect } from 'vitest';
import {
  validate,
  transferSchema,
  registerSchema,
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

describe('registerSchema', () => {
  it('rejects a short password', () => {
    expect(() =>
      validate(registerSchema, { name: 'A', email: 'a@b.com', password: '123' })
    ).toThrow(/at least 6/);
  });

  it('requires a name', () => {
    expect(() =>
      validate(registerSchema, { name: '   ', email: 'a@b.com', password: '123456' })
    ).toThrow(/Name is required/);
  });
});
