import { defineProject } from 'vitest/config';

export default defineProject({
  logLevel: 'error',
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
