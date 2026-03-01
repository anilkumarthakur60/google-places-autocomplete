import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

const coreVersion = (
  JSON.parse(readFileSync(here('../../packages/core/package.json'), 'utf-8')) as { version: string }
).version

export default defineConfig({
  root: here('.'),
  base: process.env.BASE_URL ?? '/',
  envDir: here('../..'),
  cacheDir: here('../../node_modules/.vite-landing'),
  // Single source of truth for the version badge — never hardcoded.
  define: { __PKG_VERSION__: JSON.stringify(coreVersion) },
  server: { port: 5178, host: '127.0.0.1', strictPort: true },
})
