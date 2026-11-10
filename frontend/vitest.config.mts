import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname) },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
    css: false,
    coverage: {
      include: ['components/**', 'hooks/**', 'lib/**', 'pages/**', 'services/**'],
      exclude: ['pages/_app.tsx', 'pages/_document.tsx'],
    },
  },
});
