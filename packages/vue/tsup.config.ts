import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  tsconfig: 'tsconfig.tsup.json',
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'es2022',
  outDir: 'dist',
  external: ['@anil-labs/google-places-autocomplete-core', 'vue', 'vue/jsx-runtime'],
  esbuildOptions(options) {
    // Without this, esbuild's automatic JSX transform defaults to
    // React.createElement — it compiles clean and every test that goes
    // through src/ via the dev-time compiler stays green, but the *shipped*
    // bundle throws `ReferenceError: React is not defined` the moment it
    // renders. scripts/check-dist.mjs mounts the real dist/ output precisely
    // to catch this class of bug before it ships.
    options.jsx = 'automatic'
    options.jsxImportSource = 'vue'
  },
})
