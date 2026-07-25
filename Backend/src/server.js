import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import bodyParser from 'body-parser';
import connectDB from './config/db.js';
import typeDefs from './schema/typeDefs.js';
import resolvers from './resolvers/index.js';
import { getUserFromToken } from './middleware/auth.js';
import { setupSocketHandlers } from './services/socketService.js';

const { json } = bodyParser;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

async function start() {
  await connectDB();
  setupSocketHandlers(io);

  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (err) => {
      // Don't leak internal errors in production
      if (process.env.NODE_ENV !== 'development') {
        return { message: err.message };
      }
      return err;
    },
  });

  await apollo.start();

  app.use(
    '/graphql',
    cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }),
    json(),
    expressMiddleware(apollo, {
      context: async ({ req }) => ({
        user: await getUserFromToken(req),
        io,
      }),
    })
  );

  app.get('/health', (_, res) =>
    res.json({ status: 'ok', ts: new Date().toISOString() })
  );

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`\n🏦 NeoBanking API`);
    console.log(`🚀 GraphQL:  http://localhost:${PORT}/graphql`);
    console.log(`🔌 Socket.IO ready`);
    console.log(`🌍 Env: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

start().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
