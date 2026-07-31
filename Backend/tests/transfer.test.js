import { describe, it, expect } from 'vitest';
import resolvers from '../src/resolvers/index.js';
import Transaction from '../src/models/Transaction.js';
import Notification from '../src/models/Notification.js';
import { makeUser, balanceOf, io } from './helpers.js';

const send = (user, args) => resolvers.Mutation.sendTransfer(null, args, { user, io });

describe('sendTransfer', () => {
  it('moves money instantly between two existing users', async () => {
    const { user: alice, account: aliceAcc } = await makeUser({ email: 'alice@example.com' });
    const { account: bobAcc } = await makeUser({ email: 'bob@example.com' });

    const tx = await send(alice, { recipientEmail: 'bob@example.com', amount: 200 });

    expect(tx.status).toBe('COMPLETED');
    expect(await balanceOf(aliceAcc._id)).toBe(800);
    expect(await balanceOf(bobAcc._id)).toBe(1200);
    // one notification for each side
    expect(await Notification.countDocuments({})).toBe(2);
  });

  it('rejects a transfer that exceeds the balance and leaves funds untouched', async () => {
    const { user: alice, account: aliceAcc } = await makeUser({ email: 'alice@example.com' });
    await makeUser({ email: 'bob@example.com' });

    await expect(send(alice, { recipientEmail: 'bob@example.com', amount: 5000 })).rejects.toThrow(
      /Insufficient/
    );
    expect(await balanceOf(aliceAcc._id)).toBe(1000);
    expect(await Transaction.countDocuments({})).toBe(0);
  });

  it('refuses a self-transfer', async () => {
    const { user: alice } = await makeUser({ email: 'alice@example.com' });
    await expect(
      send(alice, { recipientEmail: 'alice@example.com', amount: 10 })
    ).rejects.toThrow(/yourself/);
  });

  it('refuses to send to an unregistered recipient and leaves funds untouched', async () => {
    const { user: alice, account: aliceAcc } = await makeUser({ email: 'alice@example.com' });

    await expect(
      send(alice, { recipientEmail: 'ghost@example.com', amount: 150 })
    ).rejects.toThrow(/not registered/);
    expect(await balanceOf(aliceAcc._id)).toBe(1000);
    expect(await Transaction.countDocuments({})).toBe(0);
  });

  it('is idempotent: replaying the same key does not move money twice', async () => {
    const { user: alice, account: aliceAcc } = await makeUser({ email: 'alice@example.com' });
    await makeUser({ email: 'bob@example.com' });

    const args = { recipientEmail: 'bob@example.com', amount: 100, idempotencyKey: 'abc-123' };
    const first = await send(alice, args);
    const second = await send(alice, args);

    expect(second.id).toBe(first.id); // same transaction returned
    expect(await balanceOf(aliceAcc._id)).toBe(900); // debited once
    expect(await Transaction.countDocuments({})).toBe(1);
  });

  it('never overdraws under concurrent transfers (race safety)', async () => {
    const { user: alice, account: aliceAcc } = await makeUser({
      email: 'alice@example.com',
      balance: 1000,
    });
    const { account: bobAcc } = await makeUser({ email: 'bob@example.com', balance: 0 });

    // Two simultaneous $600 transfers from a $1000 balance — only one can win.
    const results = await Promise.allSettled([
      send(alice, { recipientEmail: 'bob@example.com', amount: 600 }),
      send(alice, { recipientEmail: 'bob@example.com', amount: 600 }),
    ]);

    const ok = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(await balanceOf(aliceAcc._id)).toBe(400); // exactly one debit, never negative
    expect(await balanceOf(bobAcc._id)).toBe(600);
  });
});
