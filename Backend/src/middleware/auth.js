import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const getUserFromToken = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).lean();
    return user || null;
  } catch {
    return null;
  }
};

export const requireAuth = (user) => {
  if (!user) throw new Error('Authentication required');
  return user;
};

export const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
