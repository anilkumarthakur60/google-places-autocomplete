import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  // Svelte's package.json resolves to a server-only build under Node's
  // default "node" condition; jsdom simulates a browser but doesn't imply
  // this condition on its own, so it must be requested explicitly.
  resolve: { conditions: ['browser'] },
  test: {
    environment: 'jsdom',
  },
})
