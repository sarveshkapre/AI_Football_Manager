import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/ui/web/src/**/*.test.ts']
  }
});
