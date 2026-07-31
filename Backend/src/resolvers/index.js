import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
import {
  sendTransferReceivedEmail,
  sendOtpEmail,
  sendPasswordResetEmail,
} from '../services/emailService.js';
import { emitToUser } from '../services/socketService.js';
import { issueOtp, verifyOtp, _peekDevOtp } from '../services/otpService.js';
import { createSession, revokeSession } from '../services/sessionService.js';
import { badRequest, notFound, insufficientFunds } from '../utils/errors.js';
import logger from '../utils/logger.js';
import {
  validate,
  emailOnlySchema,
  loginSchema,
  requestRegisterSchema,
  verifyRegisterSchema,
  resetPasswordSchema,
  transferSchema,
} from '../utils/validators.js';

// MongoDB duplicate-key error code (used to detect idempotency-key replays).
const DUPLICATE_KEY = 11000;
const REGISTER_PURPOSE = 'REGISTER';

// ─── helpers ─────────────────────────────────────────────────────────────────

const toId = (doc) => ({ ...doc, id: doc._id.toString() });

const fmtTx = (tx) => ({
  ...tx,
  id: tx._id.toString(),
  createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
});

const NOTIF_TYPES = new Set(['TRANSFER_SENT', 'TRANSFER_RECEIVED', 'SYSTEM']);

const fmtNotif = (n) => ({
  ...n,
  id: n._id.toString(),
  type: NOTIF_TYPES.has(n.type) ? n.type : 'SYSTEM',
  relatedId: n.relatedId?.toString() || null,
  createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
});

const createNotification = async (userId, title, message, type, relatedId, session = null) => {
  const [n] = await Notification.create([{ userId, title, message, type, relatedId }], { session });
  return n;
};

const authPayload = async ({ user, req }) => {
  const { token } = await createSession({
    userId: user._id,
    userAgent: req?.headers?.['user-agent'] || '',
    ip: req?.ip || '',
  });
  return { token, user: toId(user.toObject ? user.toObject() : user) };
};

const deliverOtp = ({ email, code }) => {
  sendOtpEmail({ recipientEmail: email, code }).catch((e) =>
    logger.error({ err: e }, 'OTP email failed')
  );
};

// Eventra's self-invalidating reset-token pattern: the JWT is signed with
// `JWT_SECRET + user.password`, so once the password changes the signature no
// longer verifies — a used link automatically becomes single-use, and any
// links from a previous password become instantly dead. No revocation store,
// no cleanup job, no race conditions.
const resetSecret = (user) => process.env.JWT_SECRET + user.password;

const signResetToken = (user) =>
  jwt.sign({ id: user._id.toString(), action: 'password_reset' }, resetSecret(user), {
    expiresIn: '15m',
  });

const buildResetLink = ({ req, userId, token }) => {
  const base =
    process.env.CLIENT_URL ||
    req?.headers?.origin ||
    `${req?.headers?.['x-forwarded-proto'] || 'http'}://${req?.get?.('host') || 'localhost:5173'}`;
  return `${base}/reset-password/${userId}/${token}`;
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

    getNotifications: async (_, { limit = 30 }, { user }) => {
      requireAuth(user);
      const notifs = await Notification.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      return notifs.map(fmtNotif);
    },

    _devPeekOtp: (_, { email }) => {
      if (process.env.NODE_ENV !== 'development') return null;
      return _peekDevOtp({ email, purpose: REGISTER_PURPOSE });
    },

    lookupRecipient: async (_, args, { user }) => {
      requireAuth(user);
      const { email } = validate(emailOnlySchema, args);
      if (email === user.email.toLowerCase()) return { exists: false, name: null };
      const found = await User.findOne({ email }).select('name').lean();
      return found ? { exists: true, name: found.name } : { exists: false, name: null };
    },
  },

  // ── Mutations ──────────────────────────────────────────────────────────────
  Mutation: {
    // ── Password login ──────────────────────────────────────────────────────
    loginUser: async (_, args, { req }) => {
      const { email, password } = validate(loginSchema, args);
      const user = await User.findOne({ email });
      // Generic message on both branches — no user enumeration.
      if (!user || !(await user.comparePassword(password)))
        throw badRequest('Invalid email or password');
      return authPayload({ user, req });
    },

    // ── OTP-verified registration ──────────────────────────────────────────
    // Step 1: user submits email + name + password. We validate everything,
    // check the email isn't taken, and send an OTP. The user is NOT created
    // yet — nothing to clean up if they abandon the flow.
    requestRegisterOtp: async (_, args) => {
      const { email } = validate(requestRegisterSchema, args);
      const exists = await User.exists({ email });
      // Enumeration defense: same response either way, but only actually
      // issue a code for new emails. In dev we log the skip so a stuck
      // "no OTP" isn't invisible.
      if (exists) {
        if (process.env.NODE_ENV === 'development') {
          logger.warn(
            `⏭️  register OTP skipped: ${email} is already registered (log in or use a different email)`
          );
        }
      } else {
        try {
          const { code } = await issueOtp({ email, purpose: REGISTER_PURPOSE });
          deliverOtp({ email, code });
        } catch (err) {
          if (err?.extensions?.code === 'BAD_USER_INPUT') throw err;
          logger.error({ err }, 'issueOtp(REGISTER) failed');
        }
      }
      return true;
    },

    // Step 2: verify the code and create the account atomically.
    verifyRegisterOtp: async (_, args, { req }) => {
      const { email, name, password, code } = validate(verifyRegisterSchema, args);
      if (await User.findOne({ email })) throw badRequest('Email already in use');
      await verifyOtp({ email, purpose: REGISTER_PURPOSE, code });
      const user = await new User({ name, email, password }).save();
      await new Account({ userId: user._id }).save();
      return authPayload({ user, req });
    },

    // ── Forgot / reset password (Eventra-style link) ────────────────────────
    requestPasswordReset: async (_, args, { req }) => {
      const { email } = validate(emailOnlySchema, args);
      const user = await User.findOne({ email });
      // Same response regardless of existence, again for enumeration defense.
      if (!user && process.env.NODE_ENV === 'development') {
        logger.warn(`⏭️  password reset skipped: no user with email ${email}`);
      }
      if (user) {
        try {
          const token = signResetToken(user);
          const resetLink = buildResetLink({ req, userId: user._id, token });
          await sendPasswordResetEmail({
            recipientEmail: user.email,
            recipientName: user.name,
            resetLink,
          });
        } catch (err) {
          logger.error({ err }, 'Password reset email failed');
        }
      }
      return true;
    },

    resetPassword: async (_, args) => {
      const { id, token, password } = validate(resetPasswordSchema, args);
      const user = await User.findById(id);
      if (!user) throw badRequest('Invalid or expired reset link');

      try {
        const decoded = jwt.verify(token, resetSecret(user));
        if (decoded.action !== 'password_reset' || decoded.id !== user._id.toString()) {
          throw badRequest('Invalid or expired reset link');
        }
      } catch (err) {
        // JWT verification failure (expired, tampered, or password already
        // changed — the signing secret includes the old hash).
        if (err?.extensions?.code === 'BAD_USER_INPUT') throw err;
        throw badRequest('Invalid or expired reset link');
      }

      user.password = password;
      await user.save();
      return true;
    },

    logout: async (_, __, { user }) => {
      if (user?.jti) await revokeSession(user.jti);
      return true;
    },

    // ── Money movement ──────────────────────────────────────────────────────
    sendTransfer: async (_, args, { user, io }) => {
      requireAuth(user);

      const { recipientEmail, amount, message } = validate(transferSchema, args);
      const { idempotencyKey } = args;
      const toEmail = recipientEmail;

      if (toEmail === user.email.toLowerCase())
        throw badRequest('You cannot send money to yourself');

      if (idempotencyKey) {
        const existing = await Transaction.findOne({
          idempotencyKey,
          senderEmail: user.email,
        }).lean();
        if (existing) return fmtTx(existing);
      }

      const recipient = await User.findOne({ email: toEmail });
      if (!recipient) throw badRequest('That email is not registered on Kuber');

      const session = await mongoose.startSession();

      let tx;
      let senderNewBalance;
      let receiverNewBalance;
      let senderNotif;
      let receiverNotif;

      try {
        await session.withTransaction(async () => {
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
        });

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

        return fmtTx(tx.toObject());
      } catch (err) {
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
