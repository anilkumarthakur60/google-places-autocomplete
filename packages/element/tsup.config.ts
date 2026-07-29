import { defineConfig } from 'tsup'

export default defineConfig([
  // Library build (ESM + CJS). core stays external (it's a dependency), but its
  // stylesheet subpath is force-bundled and inlined as text so the element
  // self-injects it — bundler consumers need no separate CSS import.
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    tsconfig: 'tsconfig.tsup.json',
    sourcemap: true,
    clean: true,
    treeshake: true,
    target: 'es2022',
    outDir: 'dist',
    external: ['@anil-labs/google-places-autocomplete-core'],
    noExternal: [/@anil-labs\/google-places-autocomplete-core\/styles\.css$/],
    loader: { '.css': 'text' },
  },
  // Standalone CDN build — everything (core engine + styles) bundled and
  // minified into dist/index.global.js, auto-registering <gpa-autocomplete>.
  // Drop it in via a <script> tag; do NOT also load core separately.
  {
    entry: { index: 'src/cdn.ts' },
    format: ['iife'],
    globalName: 'GooglePlacesAutocomplete',
    tsconfig: 'tsconfig.tsup.json',
    sourcemap: true,
    minify: true,
    target: 'es2022',
    outDir: 'dist',
    loader: { '.css': 'text' },
  },
])
