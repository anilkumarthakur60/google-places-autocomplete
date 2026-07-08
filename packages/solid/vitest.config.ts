import { defineConfig } from 'vitest/config'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  // solid-js resolves to a server-only build under Node's default "node"
  // condition; jsdom simulates a browser but doesn't imply this condition
  // on its own, so it must be requested explicitly.
  resolve: { conditions: ['browser'] },
  test: {
    environment: 'jsdom',
  },
})
