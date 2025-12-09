// Post-build smoke test: mounts the ACTUAL dist/index.js bundle (not src/)
// under jsdom — the same guard used by the other wrapper packages, catching
// a broken esbuild-plugin-solid transform (e.g. Solid's reactive DOM-update
// code silently failing to attach) before it ships.
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
globalThis.InputEvent = dom.window.InputEvent

const { render } = await import('solid-js/web')
const { PlacesAutocomplete } = await import('../dist/index.js')

const root = document.getElementById('app')
render(() => PlacesAutocomplete({ apiKey: 'test-key' }), root)

const input = document.querySelector('input.gpa-input')
if (!input) {
  console.error('✗ check-dist (solid): expected input.gpa-input to be rendered by the built bundle')
  process.exit(1)
}
if (input.getAttribute('role') !== 'combobox') {
  console.error('✗ check-dist (solid): input is missing role="combobox"')
  process.exit(1)
}

console.log('✓ check-dist (solid): built bundle mounts and renders the input')
