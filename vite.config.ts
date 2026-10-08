/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Unit tests (npm test): the screens' pure rules, next to them in src/.
  // The browser flows are Playwright's (tests/e2e).
  test: {
    include: ['src/**/*.test.ts'],
  },
})
