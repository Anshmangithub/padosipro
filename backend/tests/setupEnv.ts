// Ensures src/config/env.ts (which validates process.env on import) has
// everything it needs before any test file imports application code.
process.env.DATABASE_URL ??= 'file:./test.db';
process.env.JWT_SECRET ??= 'test-only-secret-do-not-use-in-prod';
