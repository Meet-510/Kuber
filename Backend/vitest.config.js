import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.js'],
    setupFiles: ['tests/setup.js'],
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-test-secret-test-secret-1234',
      // Give the in-memory mongod more time to boot (slow first run / Windows).
      MONGOMS_LAUNCH_TIMEOUT: '60000',
    },
    // mongodb-memory-server can be slow to download/boot on the first run.
    testTimeout: 30000,
    hookTimeout: 120000,
    fileParallelism: false,
  },
});
