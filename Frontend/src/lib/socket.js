import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(BACKEND_URL, { autoConnect: false, transports: ['websocket', 'polling'] });
  }
  return socket;
};

export const connectSocket = (token) => {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('authenticate', token);
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
