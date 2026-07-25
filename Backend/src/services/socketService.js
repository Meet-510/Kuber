import jwt from 'jsonwebtoken';

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('authenticate', (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId.toString();
        socket.join(userId);
        socket.userId = userId;
        socket.emit('authenticated', { userId });
        console.log(`✅ Socket authenticated: user ${userId}`);
      } catch {
        socket.emit('auth_error', { message: 'Invalid token' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};

// Emit an event to a specific user's room
export const emitToUser = (io, userId, event, data) => {
  io.to(userId.toString()).emit(event, data);
};
