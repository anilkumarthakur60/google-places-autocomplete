import { defineConfig } from 'tsup'
import { solidPlugin } from 'esbuild-plugin-solid'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  tsconfig: 'tsconfig.tsup.json',
  sourcemap: true,
  clean: true,
  target: 'es2022',
  outDir: 'dist',
  external: [
    '@anil-labs/google-places-autocomplete-core',
    'solid-js',
    'solid-js/web',
    'solid-js/store',
  ],
  // Solid's reactivity depends on its own Babel transform (fine-grained DOM
  // updates, not a vdom diff) — esbuild's generic `jsx: 'automatic'` mode
  // (what the Vue/React packages use) can't produce that; this plugin runs
  // the real babel-preset-solid inside esbuild's pipeline instead.
  esbuildPlugins: [solidPlugin()],
})
