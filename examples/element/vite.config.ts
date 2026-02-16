import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  root: here('.'),
  base: process.env.BASE_URL ?? '/',
  envDir: here('../..'),
  cacheDir: here('../../node_modules/.vite-element'),
  server: { port: 5177, host: '127.0.0.1', strictPort: true },
})
