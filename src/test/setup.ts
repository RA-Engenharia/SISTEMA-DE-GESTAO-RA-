import { beforeAll, afterAll } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only-min-32';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

beforeAll(() => {
  // Setup before all tests
});

afterAll(() => {
  // Cleanup after all tests
});
