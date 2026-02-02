import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  root: here('.'),
  base: process.env.BASE_URL ?? '/',
  envDir: here('../..'),
  cacheDir: here('../../node_modules/.vite-react'),
  plugins: [react()],
  server: { port: 5174, host: '127.0.0.1', strictPort: true },
})
