import User from '../src/models/User.js';
import Account from '../src/models/Account.js';

// Seed a user with a funded account and return both.
export const makeUser = async ({
  name = 'Test User',
  email,
  password = 'secret123',
  balance = 1000,
} = {}) => {
  const user = await new User({ name, email, password }).save();
  const account = await new Account({ userId: user._id, balance }).save();
  return { user: user.toObject(), account };
};

export const balanceOf = async (accountId) => {
  const acc = await Account.findById(accountId).lean();
  return acc?.balance;
};

// A no-op Socket.IO stub so resolvers can emit without a real server.
export const io = { to: () => ({ emit: () => {} }) };
