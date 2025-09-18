// Post-build smoke test: mounts the ACTUAL dist/index.js bundle (not src/)
// under jsdom. This is what catches an esbuild JSX-factory misconfiguration
// (e.g. a missing jsxImportSource: 'vue' in tsup.config.ts) — such a bug
// compiles clean and passes any test that goes through src/ via a dev-time
// JSX compiler, but throws `ReferenceError: React is not defined` the moment
// the shipped bundle actually renders. Nothing here should ever pass without
// actually mounting the real artifact.
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><div id="app"></div>', { url: 'http://localhost/' })
globalThis.window = dom.window
globalThis.document = dom.window.document
// Node >=21 ships its own read-only `navigator` global — overwrite it via
// defineProperty rather than assignment, which throws against a getter-only
// property.
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.Element = dom.window.Element
globalThis.Node = dom.window.Node
globalThis.Text = dom.window.Text
globalThis.Comment = dom.window.Comment
globalThis.DocumentFragment = dom.window.DocumentFragment
globalThis.SVGElement = dom.window.SVGElement
globalThis.Event = dom.window.Event
globalThis.MouseEvent = dom.window.MouseEvent
globalThis.KeyboardEvent = dom.window.KeyboardEvent

const { createApp, h } = await import('vue')
const { PlacesAutocomplete } = await import('../dist/index.js')

const root = document.getElementById('app')
const app = createApp({
  render: () => h(PlacesAutocomplete, { apiKey: 'test-key' }),
})
app.mount(root)

const input = document.querySelector('input.gpa-input')
if (!input) {
  console.error('✗ check-dist (vue): expected input.gpa-input to be rendered by the built bundle')
  process.exit(1)
}
if (input.getAttribute('role') !== 'combobox') {
  console.error('✗ check-dist (vue): input is missing role="combobox"')
  process.exit(1)
}

console.log('✓ check-dist (vue): built bundle mounts and renders the input')
