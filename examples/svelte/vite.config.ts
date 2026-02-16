import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  root: here('.'),
  base: process.env.BASE_URL ?? '/',
  envDir: here('../..'),
  cacheDir: here('../../node_modules/.vite-svelte'),
  plugins: [svelte()],
  server: { port: 5175, host: '127.0.0.1', strictPort: true },
})
