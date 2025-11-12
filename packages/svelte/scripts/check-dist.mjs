// Post-build smoke test against the ACTUAL dist/ artifact (not src/).
//
// Unlike the Vue/React wrappers, Svelte ships dist/PlacesAutocomplete.svelte
// as source — that's the correct, standard shape for a Svelte component
// package; the *consumer's* bundler compiles it with whatever Svelte version
// they have installed. Plain Node can't execute .svelte syntax at all, so
// this script does what a consumer's bundler would do: compile the shipped
// file with svelte/compiler, then mount the result under jsdom. That still
// catches real shipping defects (a bad export, a build step that mangled the
// file) without needing a full Vite pipeline just for a smoke test.
import { JSDOM } from 'jsdom'
import { compile } from 'svelte/compiler'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const dom = new JSDOM('<!doctype html><div id="app"></div>', { url: 'http://localhost/' })
globalThis.window = dom.window
globalThis.document = dom.window.document
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.Element = dom.window.Element
globalThis.Node = dom.window.Node
globalThis.Text = dom.window.Text
globalThis.Comment = dom.window.Comment
globalThis.DocumentFragment = dom.window.DocumentFragment
globalThis.Event = dom.window.Event
globalThis.MouseEvent = dom.window.MouseEvent
globalThis.KeyboardEvent = dom.window.KeyboardEvent
globalThis.customElements = dom.window.customElements
globalThis.CustomEvent = dom.window.CustomEvent

const sourcePath = new URL('../dist/PlacesAutocomplete.svelte', import.meta.url)
const compiledPath = new URL('../dist/.check-dist-compiled.mjs', import.meta.url)

const source = readFileSync(sourcePath, 'utf-8')
const { js } = compile(source, { filename: 'PlacesAutocomplete.svelte', generate: 'client' })
writeFileSync(compiledPath, js.code)

const { mount } = await import('svelte')
const { default: PlacesAutocomplete } = await import(compiledPath.href)

const root = document.getElementById('app')
mount(PlacesAutocomplete, { target: root, props: { apiKey: 'test-key' } })

const input = document.querySelector('input.gpa-input')
const ok = input && input.getAttribute('role') === 'combobox'

// Clean up the scratch file regardless of outcome — it's a check artifact, not a shipped file.
try {
  const { unlinkSync } = await import('node:fs')
  unlinkSync(fileURLToPath(compiledPath))
} catch {
  /* best-effort cleanup */
}

if (!ok) {
  console.error('✗ check-dist (svelte): expected input.gpa-input[role="combobox"] after mounting')
  process.exit(1)
}

console.log('✓ check-dist (svelte): built component compiles and mounts, rendering the input')
