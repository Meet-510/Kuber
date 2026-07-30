import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    logger.debug(`🔌 Socket connected: ${socket.id}`);

    socket.on('authenticate', (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId.toString();
        socket.join(userId);
        socket.userId = userId;
        socket.emit('authenticated', { userId });
        logger.debug(`✅ Socket authenticated: user ${userId}`);
      } catch {
        socket.emit('auth_error', { message: 'Invalid token' });
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};

// Emit an event to a specific user's room
export const emitToUser = (io, userId, event, data) => {
  io.to(userId.toString()).emit(event, data);
};
