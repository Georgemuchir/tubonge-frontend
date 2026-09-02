import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Baked into the bundle at build time — every build gets a fresh, always-
  // increasing number automatically, no version string to remember to bump.
  // The in-app update gate (native only) compares this against the backend's
  // latest_build to know whether this install is current.
  define: {
    __APP_BUILD__: Date.now(),
  },
  server: {
    port: 3000,
    host: true,
    cors: true
  },
  preview: {
    port: 3000,
    host: true
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
  },
})
