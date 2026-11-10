import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./test.db',
      CORS_ORIGIN: 'http://localhost:3000',
    },
    globalSetup: ['tests/globalSetup.ts'],
    setupFiles: ['tests/setup.ts'],
    fileParallelism: false,
    coverage: {
      include: ['src/**'],
      exclude: ['src/index.ts'],
    },
  },
});
