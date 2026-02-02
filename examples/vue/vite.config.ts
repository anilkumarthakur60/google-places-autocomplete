import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  root: here('.'),
  base: process.env.BASE_URL ?? '/',
  // A shared root .env supplies VITE_GOOGLE_PLACES_API_KEY to every example.
  envDir: here('../..'),
  // Per-playground cacheDir — without this all 5 vite dev servers share
  // node_modules/.vite/ and clobber each other's optimized deps.
  cacheDir: here('../../node_modules/.vite-vue'),
  plugins: [vue()],
  server: { port: 5173, host: '127.0.0.1', strictPort: true },
})
