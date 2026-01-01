import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        'prisma/**',
        'vitest.config.ts',
      ],
    },
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
