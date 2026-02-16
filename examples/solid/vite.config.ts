import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  root: here('.'),
  base: process.env.BASE_URL ?? '/',
  envDir: here('../..'),
  cacheDir: here('../../node_modules/.vite-solid'),
  plugins: [solid()],
  server: { port: 5176, host: '127.0.0.1', strictPort: true },
})
