import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Goal from '../models/Goal.js';
import Notification from '../models/Notification.js';
import { generateToken, requireAuth } from '../middleware/auth.js';
import { sendTransferReceivedEmail, sendTransferInviteEmail } from '../services/emailService.js';
import { emitToUser } from '../services/socketService.js';
import { badRequest, notFound, insufficientFunds } from '../utils/errors.js';
import logger from '../utils/logger.js';
import {
  validate,
  registerSchema,
  loginSchema,
  transferSchema,
  createGoalSchema,
  addToGoalSchema,
} from '../utils/validators.js';

// MongoDB duplicate-key error code (used to detect idempotency-key replays).
const DUPLICATE_KEY = 11000;

// ─── helpers ─────────────────────────────────────────────────────────────────

const toId = (doc) => ({ ...doc, id: doc._id.toString() });

const fmtTx = (tx) => ({
  ...tx,
  id: tx._id.toString(),
  createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
});

const fmtGoal = (goal) => ({
  ...goal,
  id: goal._id.toString(),
  progress: Math.min((goal.savedAmount / goal.targetAmount) * 100, 100),
  deadline: goal.deadline ? new Date(goal.deadline).toISOString() : null,
  createdAt: goal.createdAt instanceof Date ? goal.createdAt.toISOString() : goal.createdAt,
});

const fmtNotif = (n) => ({
  ...n,
  id: n._id.toString(),
  relatedId: n.relatedId?.toString() || null,
  createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
});

const createNotification = async (userId, title, message, type, relatedId, session = null) => {
  const [n] = await Notification.create([{ userId, title, message, type, relatedId }], { session });
  return n;
};

// ─── resolvers ────────────────────────────────────────────────────────────────

const resolvers = {
  // ── Type field resolvers ───────────────────────────────────────────────────
  User: {
    id: (u) => u._id?.toString() || u.id,
    accounts: async (u) => {
      const accs = await Account.find({ userId: u._id || u.id }).lean();
      return accs.map((a) => ({ ...a, id: a._id.toString(), createdAt: a.createdAt.toISOString() }));
    },
    goals: async (u) => {
      const goals = await Goal.find({ userId: u._id || u.id }).sort({ createdAt: -1 }).lean();
      return goals.map(fmtGoal);
    },
    notifications: async (u) => {
      const notifs = await Notification.find({ userId: u._id || u.id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      return notifs.map(fmtNotif);
    },
    unreadNotifications: async (u) =>
      Notification.countDocuments({ userId: u._id || u.id, read: false }),
    createdAt: (u) => (u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt),
  },

  Account: {
    id: (a) => a._id?.toString() || a.id,
    transactions: async (a) => {
      const txs = await Transaction.find({
        $or: [{ senderAccount: a._id || a.id }, { receiverAccount: a._id || a.id }],
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      return txs.map(fmtTx);
    },
    createdAt: (a) => (a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt),
  },

  Transaction: {
    id: (t) => t._id?.toString() || t.id,
    createdAt: (t) => (t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt),
  },

  Goal: {
    id: (g) => g._id?.toString() || g.id,
    progress: (g) => Math.min((g.savedAmount / g.targetAmount) * 100, 100),
    deadline: (g) => (g.deadline ? new Date(g.deadline).toISOString() : null),
    createdAt: (g) => (g.createdAt instanceof Date ? g.createdAt.toISOString() : g.createdAt),
  },

  Notification: {
    id: (n) => n._id?.toString() || n.id,
    relatedId: (n) => n.relatedId?.toString() || null,
    createdAt: (n) => (n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt),
  },

  // ── Queries ────────────────────────────────────────────────────────────────
  Query: {
    getMe: async (_, __, { user }) => {
      if (!user) return null;
      const u = await User.findById(user._id).lean();
      return u ? toId(u) : null;
    },

    getAccounts: async (_, __, { user }) => {
      requireAuth(user);
      const accs = await Account.find({ userId: user._id }).lean();
      return accs.map((a) => ({ ...a, id: a._id.toString(), createdAt: a.createdAt.toISOString() }));
    },

    getTransactions: async (_, { limit = 50, offset = 0 }, { user }) => {
      requireAuth(user);
      const account = await Account.findOne({ userId: user._id }).lean();
      if (!account) return { items: [], totalCount: 0, hasMore: false };

      const filter = {
        $or: [{ senderAccount: account._id }, { receiverAccount: account._id }],
      };

      const [txs, totalCount] = await Promise.all([
        Transaction.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
        Transaction.countDocuments(filter),
      ]);

      return {
        items: txs.map(fmtTx),
        totalCount,
        hasMore: offset + txs.length < totalCount,
      };
    },

    getGoals: async (_, __, { user }) => {
      requireAuth(user);
      const goals = await Goal.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
      return goals.map(fmtGoal);
    },

    getNotifications: async (_, { limit = 30 }, { user }) => {
      requireAuth(user);
      const notifs = await Notification.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      return notifs.map(fmtNotif);
    },

    getSpendingAnalytics: async (_, __, { user }) => {
      requireAuth(user);
      const account = await Account.findOne({ userId: user._id }).lean();
      if (!account) return [];

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Aggregate the sent/received totals per month in the database rather
      // than loading every transaction into Node and reducing in JS — this
      // scales to any history size and does the grouping where the data lives.
      const rows = await Transaction.aggregate([
        {
          $match: {
            $or: [{ senderAccount: account._id }, { receiverAccount: account._id }],
            status: 'COMPLETED',
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: { $dateTrunc: { date: '$createdAt', unit: 'month' } },
            sent: {
              $sum: { $cond: [{ $eq: ['$senderAccount', account._id] }, '$amount', 0] },
            },
            received: {
              $sum: { $cond: [{ $eq: ['$senderAccount', account._id] }, 0, '$amount'] },
            },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 6 },
      ]);

      return rows.map(({ _id, sent, received }) => ({
        month: new Date(_id).toLocaleString('default', { month: 'short', year: '2-digit' }),
        sent,
        received,
      }));
    },
  },

  // ── Mutations ──────────────────────────────────────────────────────────────
  Mutation: {
    registerUser: async (_, args) => {
      const { name, email, password } = validate(registerSchema, args);
      if (await User.findOne({ email })) throw badRequest('Email already in use');

      const user = await new User({ name, email, password }).save();
      const account = await new Account({ userId: user._id }).save();

      // Auto-credit any pending transfers sent to this email
      const pending = await Transaction.find({ receiverEmail: email, status: 'PENDING' });
      for (const tx of pending) {
        account.balance += tx.amount;
        tx.status = 'COMPLETED';
        tx.receiverAccount = account._id;
        tx.receiverName = name;
        await tx.save();
        await createNotification(
          user._id,
          'Pending Transfer Received!',
          `$${tx.amount} CAD from ${tx.senderName} has been credited.`,
          'TRANSFER_RECEIVED',
          tx._id
        );
      }
      if (pending.length) await account.save();

      const token = generateToken(user._id.toString());
      return { token, user: toId(user.toJSON()) };
    },

    loginUser: async (_, args) => {
      const { email, password } = validate(loginSchema, args);
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password)))
        throw badRequest('Invalid email or password');

      const token = generateToken(user._id.toString());
      return { token, user: toId(user.toJSON()) };
    },

    sendTransfer: async (_, args, { user, io }) => {
      requireAuth(user);

      const { recipientEmail, amount, message } = validate(transferSchema, args);
      const { idempotencyKey } = args;
      const toEmail = recipientEmail; // already normalized by the validator

      if (toEmail === user.email.toLowerCase())
        throw badRequest('You cannot send money to yourself');

      // Idempotency: a replayed request (double-click, network retry) with the
      // same key returns the original transaction instead of moving money again.
      if (idempotencyKey) {
        const existing = await Transaction.findOne({
          idempotencyKey,
          senderEmail: user.email,
        }).lean();
        if (existing) return fmtTx(existing);
      }

      const session = await mongoose.startSession();

      // Captured inside the transaction, consumed after it commits.
      let tx;
      let senderNewBalance;
      let recipient = null;
      let receiverNewBalance;
      let senderNotif;
      let receiverNotif;

      try {
        await session.withTransaction(async () => {
          // Atomic conditional debit — never read-modify-write.
          const senderAccount = await Account.findOneAndUpdate(
            { userId: user._id, balance: { $gte: amount } },
            { $inc: { balance: -amount } },
            { new: true, session }
          );

          if (!senderAccount) {
            const existing = await Account.findOne({ userId: user._id }).session(session);
            if (existing) throw insufficientFunds();
            throw badRequest('No account found. Please contact support.');
          }
          senderNewBalance = senderAccount.balance;

          const found = await User.findOne({ email: toEmail }).session(session);

          if (found) {
            // ── Instant transfer ──────────────────────────────────────────
            recipient = found;
            const receiverAccount = await Account.findOneAndUpdate(
              { userId: recipient._id },
              { $inc: { balance: amount } },
              { new: true, session }
            );
            if (!receiverAccount) throw badRequest('Recipient has no account');
            receiverNewBalance = receiverAccount.balance;

            [tx] = await Transaction.create(
              [
                {
                  senderAccount: senderAccount._id,
                  receiverAccount: receiverAccount._id,
                  senderEmail: user.email,
                  receiverEmail: toEmail,
                  senderName: user.name,
                  receiverName: recipient.name,
                  amount,
                  message,
                  status: 'COMPLETED',
                  idempotencyKey: idempotencyKey || null,
                },
              ],
              { session }
            );

            senderNotif = await createNotification(
              user._id,
              'Transfer Sent',
              `$${amount} CAD sent to ${recipient.name}`,
              'TRANSFER_SENT',
              tx._id,
              session
            );
            receiverNotif = await createNotification(
              recipient._id,
              'Money Received!',
              `${user.name} sent you $${amount} CAD`,
              'TRANSFER_RECEIVED',
              tx._id,
              session
            );
          } else {
            // ── Pending transfer (invite flow) ────────────────────────────
            [tx] = await Transaction.create(
              [
                {
                  senderAccount: senderAccount._id,
                  senderEmail: user.email,
                  receiverEmail: toEmail,
                  senderName: user.name,
                  amount,
                  message,
                  status: 'PENDING',
                  pendingToken: uuidv4(),
                  idempotencyKey: idempotencyKey || null,
                },
              ],
              { session }
            );

            senderNotif = await createNotification(
              user._id,
              'Transfer Pending',
              `$${amount} CAD pending — ${recipientEmail} hasn't registered yet`,
              'TRANSFER_PENDING',
              tx._id,
              session
            );
          }
        });

        // ── Side effects: ONLY after the transaction commits ──────────────
        if (recipient) {
          emitToUser(io, user._id.toString(), 'transfer_sent', {
            transaction: fmtTx(tx.toObject()),
            newBalance: senderNewBalance,
            notification: fmtNotif(senderNotif.toObject()),
          });
          emitToUser(io, recipient._id.toString(), 'transfer_received', {
            transaction: fmtTx(tx.toObject()),
            newBalance: receiverNewBalance,
            senderName: user.name,
            amount,
            notification: fmtNotif(receiverNotif.toObject()),
          });

          sendTransferReceivedEmail({
            recipientEmail,
            recipientName: recipient.name,
            senderName: user.name,
            amount,
            message,
          }).catch((e) => logger.error({ err: e }, 'Transfer-received email failed'));
        } else {
          emitToUser(io, user._id.toString(), 'transfer_pending', {
            transaction: fmtTx(tx.toObject()),
            newBalance: senderNewBalance,
            notification: fmtNotif(senderNotif.toObject()),
          });

          sendTransferInviteEmail({
            recipientEmail,
            senderName: user.name,
            amount,
            message,
          }).catch((e) => logger.error({ err: e }, 'Transfer-invite email failed'));
        }

        return fmtTx(tx.toObject());
      } catch (err) {
        // Idempotency race: a concurrent request with the same key already
        // committed. Return the winning transaction instead of erroring.
        if (err?.code === DUPLICATE_KEY && idempotencyKey) {
          const existing = await Transaction.findOne({
            idempotencyKey,
            senderEmail: user.email,
          }).lean();
          if (existing) return fmtTx(existing);
        }
        throw err;
      } finally {
        await session.endSession();
      }
    },

    createGoal: async (_, args, { user }) => {
      requireAuth(user);
      const { name, targetAmount, deadline, color, icon } = validate(createGoalSchema, args);
      const goal = await new Goal({
        userId: user._id,
        name,
        targetAmount,
        deadline: deadline ? new Date(deadline) : null,
        color: color || '#1f5c3d',
        icon: icon || '🎯',
      }).save();
      return fmtGoal(goal.toObject());
    },

    addToGoal: async (_, args, { user, io }) => {
      requireAuth(user);
      const { goalId, amount } = validate(addToGoalSchema, args);

      const session = await mongoose.startSession();

      // Captured inside the transaction, consumed after it commits.
      let goal;
      let newBalance;
      let notif;

      try {
        await session.withTransaction(async () => {
          goal = await Goal.findOne({ _id: goalId, userId: user._id }).session(session);
          if (!goal) throw notFound('Goal not found');

          const remaining = goal.targetAmount - goal.savedAmount;
          if (remaining <= 0) throw badRequest('This goal is already complete');

          // Money-safe: never debit more than the goal needs.
          const applied = Math.min(amount, remaining);

          // Atomic conditional debit — never read-modify-write.
          const account = await Account.findOneAndUpdate(
            { userId: user._id, balance: { $gte: applied } },
            { $inc: { balance: -applied } },
            { new: true, session }
          );

          if (!account) {
            const existing = await Account.findOne({ userId: user._id }).session(session);
            if (existing) throw insufficientFunds();
            throw notFound('Account not found');
          }
          newBalance = account.balance;

          goal.savedAmount += applied;
          if (goal.savedAmount >= goal.targetAmount) goal.completed = true;
          await goal.save({ session });

          const progress = Math.round((goal.savedAmount / goal.targetAmount) * 100);
          notif = await createNotification(
            user._id,
            goal.completed ? 'Goal Achieved! 🎉' : 'Goal Updated',
            goal.completed
              ? `Congratulations! You've reached your "${goal.name}" goal!`
              : `$${applied} added to "${goal.name}" — ${progress}% complete`,
            'GOAL_PROGRESS',
            goal._id,
            session
          );
        });

        // ── Side effects: ONLY after the transaction commits ──────────────
        emitToUser(io, user._id.toString(), 'goal_updated', {
          goal: fmtGoal(goal.toObject()),
          newBalance,
          notification: fmtNotif(notif.toObject()),
        });

        return fmtGoal(goal.toObject());
      } finally {
        await session.endSession();
      }
    },

    deleteGoal: async (_, { goalId }, { user }) => {
      requireAuth(user);
      const result = await Goal.deleteOne({ _id: goalId, userId: user._id });
      return result.deletedCount > 0;
    },

    markNotificationRead: async (_, { notificationId }, { user }) => {
      requireAuth(user);
      const n = await Notification.findOneAndUpdate(
        { _id: notificationId, userId: user._id },
        { read: true },
        { new: true }
      ).lean();
      if (!n) throw notFound('Notification not found');
      return fmtNotif(n);
    },

    markAllNotificationsRead: async (_, __, { user }) => {
      requireAuth(user);
      await Notification.updateMany({ userId: user._id, read: false }, { read: true });
      return true;
    },

    updateProfile: async (_, { name, avatar }, { user }) => {
      requireAuth(user);
      const updates = {};
      if (name) updates.name = name;
      if (avatar !== undefined) updates.avatar = avatar;
      const updated = await User.findByIdAndUpdate(user._id, updates, { new: true }).lean();
      return toId(updated);
    },
  },
};

export default resolvers;
