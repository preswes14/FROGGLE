import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use jsdom for browser environment simulation
    environment: 'jsdom',

    // Setup file runs before all tests
    setupFiles: ['./tests/setup.js'],

    // Test file patterns
    include: ['tests/**/*.test.js'],

    // Verbose output for clarity
    reporters: ['verbose'],

    // Fail fast on first error during development
    bail: 0,

    // Timeout for each test (5 seconds)
    testTimeout: 5000,
  },
});
