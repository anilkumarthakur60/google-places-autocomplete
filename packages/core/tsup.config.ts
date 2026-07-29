import { defineConfig } from 'tsup'
import { copyFileSync } from 'node:fs'

export default defineConfig({
  entry: ['src/index.ts'],
  // `iife` produces dist/index.global.js — a plain <script>-tag build exposing
  // the engine as `window.GooglePlacesAutocompleteCore`, for no-bundler use.
  format: ['esm', 'cjs', 'iife'],
  globalName: 'GooglePlacesAutocompleteCore',
  dts: true,
  tsconfig: 'tsconfig.tsup.json',
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'es2022',
  outDir: 'dist',
  onSuccess: async () => {
    copyFileSync('src/styles.css', 'dist/styles.css')
  },
})
