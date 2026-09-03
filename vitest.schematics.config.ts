import { defineConfig } from 'vitest/config';

/**
 * Schematics run in Node, not the browser, and are tested against the compiled
 * output in dist/ — so they need their own config rather than the Angular
 * unit-test builder.
 */
export default defineConfig({
  test: {
    name: 'schematics',
    include: ['projects/core/schematics/**/*.spec.ts'],
    environment: 'node',
    globals: false,
  },
});
