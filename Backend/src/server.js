import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import bodyParser from 'body-parser';
import { loadEnv } from './utils/env.js';
import logger from './utils/logger.js';
import connectDB from './config/db.js';
import typeDefs from './schema/typeDefs.js';
import resolvers from './resolvers/index.js';
import { getUserFromToken } from './middleware/auth.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { setupSocketHandlers } from './services/socketService.js';

const env = loadEnv();
const { json } = bodyParser;

const app = express();
app.set('trust proxy', 1); // correct client IPs behind a proxy (Render/Railway)

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

async function start() {
  await connectDB(env.MONGODB_URI);
  setupSocketHandlers(io);

  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (err) => {
      const code = err.extensions?.code;
      // Expected, client-facing errors (bad input, auth, etc.) are noise at
      // error level; only unexpected failures get logged loudly.
      const expected = ['BAD_USER_INPUT', 'UNAUTHENTICATED', 'NOT_FOUND', 'INSUFFICIENT_FUNDS'];
      if (!expected.includes(code)) logger.error({ err }, 'Unexpected GraphQL error');

      if (env.NODE_ENV === 'development') return err;
      return { message: err.message, extensions: { code } };
    },
  });

  await apollo.start();

  app.use(
    '/graphql',
    cors({ origin: env.CLIENT_URL, credentials: true }),
    apiLimiter,
    json(),
    expressMiddleware(apollo, {
      context: async ({ req }) => ({
        user: await getUserFromToken(req),
        io,
      }),
    })
  );

  app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

  httpServer.listen(env.PORT, () => {
    logger.info(`🏦 Kuber API ready`);
    logger.info(`🚀 GraphQL:  http://localhost:${env.PORT}/graphql`);
    logger.info(`🔌 Socket.IO ready`);
    logger.info(`🌍 Env: ${env.NODE_ENV}`);
  });
}

start().catch((err) => {
  logger.error({ err }, 'Server failed to start');
  process.exit(1);
});
