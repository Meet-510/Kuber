import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Goal from '../models/Goal.js';
import Notification from '../models/Notification.js';
import { generateToken, requireAuth } from '../middleware/auth.js';
import { sendTransferReceivedEmail, sendTransferInviteEmail } from '../services/emailService.js';
import { emitToUser } from '../services/socketService.js';

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

const createNotification = async (userId, title, message, type, relatedId) => {
  const n = new Notification({ userId, title, message, type, relatedId });
  await n.save();
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
      if (!account) return [];
      const txs = await Transaction.find({
        $or: [{ senderAccount: account._id }, { receiverAccount: account._id }],
      })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean();
      return txs.map(fmtTx);
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

      const txs = await Transaction.find({
        $or: [{ senderAccount: account._id }, { receiverAccount: account._id }],
        status: 'COMPLETED',
        createdAt: { $gte: sixMonthsAgo },
      }).lean();

      const monthMap = {};
      txs.forEach((tx) => {
        const d = new Date(tx.createdAt);
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!monthMap[key]) monthMap[key] = { month: key, sent: 0, received: 0, ts: d.getTime() };
        if (tx.senderAccount?.toString() === account._id.toString()) {
          monthMap[key].sent += tx.amount;
        } else {
          monthMap[key].received += tx.amount;
        }
      });

      return Object.values(monthMap)
        .sort((a, b) => a.ts - b.ts)
        .slice(-6)
        .map(({ month, sent, received }) => ({ month, sent, received }));
    },
  },

  // ── Mutations ──────────────────────────────────────────────────────────────
  Mutation: {
    registerUser: async (_, { name, email, password }) => {
      if (await User.findOne({ email })) throw new Error('Email already in use');

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

    loginUser: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password)))
        throw new Error('Invalid email or password');

      const token = generateToken(user._id.toString());
      return { token, user: toId(user.toJSON()) };
    },

    sendTransfer: async (_, { recipientEmail, amount, message = '' }, { user, io }) => {
      requireAuth(user);

      if (recipientEmail.toLowerCase() === user.email.toLowerCase())
        throw new Error('You cannot send money to yourself');
      if (amount <= 0) throw new Error('Amount must be greater than 0');

      const senderAccount = await Account.findOne({ userId: user._id });
      if (!senderAccount) throw new Error('No account found. Please contact support.');
      if (senderAccount.balance < amount) throw new Error('Insufficient balance');

      // Deduct from sender immediately
      senderAccount.balance -= amount;
      await senderAccount.save();

      const recipient = await User.findOne({ email: recipientEmail.toLowerCase() }).lean();

      let tx;

      if (recipient) {
        // ── Instant transfer ──────────────────────────────────────────────
        const receiverAccount = await Account.findOne({ userId: recipient._id });
        if (!receiverAccount) throw new Error('Recipient has no account');

        receiverAccount.balance += amount;
        await receiverAccount.save();

        tx = await new Transaction({
          senderAccount: senderAccount._id,
          receiverAccount: receiverAccount._id,
          senderEmail: user.email,
          receiverEmail: recipientEmail,
          senderName: user.name,
          receiverName: recipient.name,
          amount,
          message,
          status: 'COMPLETED',
        }).save();

        // Notifications
        const [sn, rn] = await Promise.all([
          createNotification(
            user._id,
            'Transfer Sent',
            `$${amount} CAD sent to ${recipient.name}`,
            'TRANSFER_SENT',
            tx._id
          ),
          createNotification(
            recipient._id,
            'Money Received!',
            `${user.name} sent you $${amount} CAD`,
            'TRANSFER_RECEIVED',
            tx._id
          ),
        ]);

        // Real-time events
        emitToUser(io, user._id.toString(), 'transfer_sent', {
          transaction: fmtTx(tx.toObject()),
          newBalance: senderAccount.balance,
          notification: fmtNotif(sn.toObject()),
        });
        emitToUser(io, recipient._id.toString(), 'transfer_received', {
          transaction: fmtTx(tx.toObject()),
          newBalance: receiverAccount.balance,
          senderName: user.name,
          amount,
          notification: fmtNotif(rn.toObject()),
        });

        // Email (fire-and-forget)
        sendTransferReceivedEmail({
          recipientEmail,
          recipientName: recipient.name,
          senderName: user.name,
          amount,
          message,
        }).catch((e) => console.error('Email error:', e.message));
      } else {
        // ── Pending transfer (invite flow) ────────────────────────────────
        tx = await new Transaction({
          senderAccount: senderAccount._id,
          senderEmail: user.email,
          receiverEmail: recipientEmail,
          senderName: user.name,
          amount,
          message,
          status: 'PENDING',
          pendingToken: uuidv4(),
        }).save();

        const sn = await createNotification(
          user._id,
          'Transfer Pending',
          `$${amount} CAD pending — ${recipientEmail} hasn't registered yet`,
          'TRANSFER_PENDING',
          tx._id
        );

        emitToUser(io, user._id.toString(), 'transfer_pending', {
          transaction: fmtTx(tx.toObject()),
          newBalance: senderAccount.balance,
          notification: fmtNotif(sn.toObject()),
        });

        sendTransferInviteEmail({
          recipientEmail,
          senderName: user.name,
          amount,
          message,
        }).catch((e) => console.error('Invite email error:', e.message));
      }

      return fmtTx(tx.toObject());
    },

    createGoal: async (_, { name, targetAmount, deadline, color, icon }, { user }) => {
      requireAuth(user);
      const goal = await new Goal({
        userId: user._id,
        name,
        targetAmount,
        deadline: deadline ? new Date(deadline) : null,
        color: color || '#8b5cf6',
        icon: icon || '🎯',
      }).save();
      return fmtGoal(goal.toObject());
    },

    addToGoal: async (_, { goalId, amount }, { user, io }) => {
      requireAuth(user);
      if (amount <= 0) throw new Error('Amount must be greater than 0');

      const [goal, account] = await Promise.all([
        Goal.findOne({ _id: goalId, userId: user._id }),
        Account.findOne({ userId: user._id }),
      ]);

      if (!goal) throw new Error('Goal not found');
      if (!account) throw new Error('Account not found');
      if (account.balance < amount) throw new Error('Insufficient balance');

      account.balance -= amount;
      goal.savedAmount = Math.min(goal.savedAmount + amount, goal.targetAmount);
      if (goal.savedAmount >= goal.targetAmount) goal.completed = true;

      await Promise.all([account.save(), goal.save()]);

      const progress = Math.round((goal.savedAmount / goal.targetAmount) * 100);
      const n = await createNotification(
        user._id,
        goal.completed ? 'Goal Achieved! 🎉' : 'Goal Updated',
        goal.completed
          ? `Congratulations! You've reached your "${goal.name}" goal!`
          : `$${amount} added to "${goal.name}" — ${progress}% complete`,
        'GOAL_PROGRESS',
        goal._id
      );

      emitToUser(io, user._id.toString(), 'goal_updated', {
        goal: fmtGoal(goal.toObject()),
        newBalance: account.balance,
        notification: fmtNotif(n.toObject()),
      });

      return fmtGoal(goal.toObject());
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
      if (!n) throw new Error('Notification not found');
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
