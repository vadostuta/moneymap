import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Plain logic tests (src/**/*.test.ts), kept apart from the Storybook
// browser project in vitest.config.ts: `npm run test:unit`
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
})
