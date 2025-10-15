// Post-build smoke test: mounts the ACTUAL dist/index.js bundle (not src/)
// under jsdom, the same guard used by the Vue package for the equivalent
// JSX-factory bug class (see packages/vue/scripts/check-dist.mjs).
import { JSDOM } from 'jsdom'

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

const { createRoot } = await import('react-dom/client')
const { flushSync } = await import('react-dom')
const { createElement } = await import('react')
const { PlacesAutocomplete } = await import('../dist/index.js')

const root = document.getElementById('app')
const reactRoot = createRoot(root)
// `flushSync` forces a synchronous commit instead of going through the
// concurrent scheduler, which under jsdom doesn't reliably drain without a
// browser-grade MessageChannel/rAF loop.
flushSync(() => {
  reactRoot.render(createElement(PlacesAutocomplete, { apiKey: 'test-key' }))
})

const input = document.querySelector('input.gpa-input')
if (!input) {
  console.error('✗ check-dist (react): expected input.gpa-input to be rendered by the built bundle')
  process.exit(1)
}
if (input.getAttribute('role') !== 'combobox') {
  console.error('✗ check-dist (react): input is missing role="combobox"')
  process.exit(1)
}

console.log('✓ check-dist (react): built bundle mounts and renders the input')
